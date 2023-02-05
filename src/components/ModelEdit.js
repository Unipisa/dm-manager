import { useState } from 'react'
import { Form, Button, ButtonGroup } from 'react-bootstrap'
import { Card } from 'react-bootstrap'

import { useEngine } from '../Engine'
import { ModelInputs } from '../components/ModelInput'
import Timestamps from '../components/Timestamps'
import Loading from '../components/Loading'

export default function ModelEdit({Model, id, clone_id, onSave, onCancel, onDelete}) {
    const create = (id === 'new')
    const [modifiedObj, setModifiedObj] = useState(null)
    const objCode = Model.code
    const objName = Model.name
    const oa = Model.oa 
    const describe = Model.describe.bind(Model)
    const onChange = Model.onObjectChange.bind(Model)
    const engine = useEngine()
    const putObj = engine.usePut(objCode, (obj) => {
        engine.addInfoMessage(`nuov${oa} ${objName} ${describe(obj)} inserit${oa}`)
        onSave(obj)
        console.log(`putObj return: ${JSON.stringify(obj)}`)
    })
    const patchObj = engine.usePatch(objCode, (response, obj) => {
        engine.addInfoMessage(`${objName} ${describe(obj)} modificat${oa}`)
        onSave(obj)
    })
    const deleteObj = engine.useDelete(objCode, (response, obj) => {
        engine.addWarningMessage(`${objName} ${describe(obj)} eliminat${oa}`)
        onDelete ? onDelete() : onCancel()
    })
    const query = engine.useGet(Model.code, clone_id ? clone_id : id)

    if (query.isError) return <div>errore caricamento</div>
    if (modifiedObj === null) {
        if (query.isSuccess) setModifiedObj({...query.data})
        return <Loading />
    }
    const originalObj = query.data

    function compareValue(v1, v2) {
        // capita di confrontare una stringa con una data
        if (JSON.stringify(v1) === JSON.stringify(v2)) return true
        if (typeof(v1) !== typeof(v2)) return false
        if (Array.isArray(v1)) {
            if (v1.length !== v2.length) return false
            for (let i=0; i<v1.length; i++) {
                if (!compareValue(v1[i], v2[i])) return false
            }
            return true
        }
        if (typeof(v1) === 'object') return (v1?._id && v1?._id === v2?._id)
        return v1 === v2
    }

    const modifiedFields = Object.keys(modifiedObj)
        .filter(key => !compareValue(modifiedObj[key], originalObj[key]))

    const changed = modifiedFields.length > 0

    const submit = (evt) => {
        console.log(`SUBMIT. originalObj: ${JSON.stringify(originalObj)} ModifiedObj: ${JSON.stringify(modifiedObj)}`)
        let obj = modifiedObj
        if (obj._id) {
            let payload = Object.fromEntries(
                modifiedFields
                .map(key => ([key, obj[key]])))
            payload._id = obj._id
            /**
             * unable to get the result from patchObj
             * we should return after that
             */
            patchObj(payload)
        } else {
            /**
             * unable to get the result from putObj
             * we should return after that
             */
            putObj(obj)
        }
    }

    // console.log(`ModelPage obj: ${JSON.stringify(obj)}`)

    return <Card>
        <Card.Header>
            <h3>{ create 
                    ? `nuov${Model.oa} ${Model.name}` 
                    : `modifica ${Model.name} ${Model.describe(modifiedObj)}`
            }</h3>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={ (event) => event.preventDefault() }>
            <ModelInputs 
                schema={Model.schema.fields} 
                obj={modifiedObj} 
                setObj={setModifiedObj} 
                modifiedFields={modifiedFields}
                onChange={onChange && onChange(setModifiedObj)} 
                />
            <ButtonGroup className="mt-3">
                <Button 
                    onClick={ submit } 
                    className="btn-primary"
                    disabled= { !changed }>
                    {create ? `aggiungi ${objName}` : `salva modifiche`}
                </Button>
                <Button 
                    onClick={ onCancel }
                    className="btn btn-secondary">
                    annulla modifiche
                </Button>
                {!create && <Button
                    onClick={ () => deleteObj(modifiedObj) }
                    className="btn btn-danger pull-right">
                        elimina {objName}
                </Button>}
            </ButtonGroup>
          </Form>
        </Card.Body>
        <Card.Footer>
            <Timestamps obj={originalObj} />
        </Card.Footer>
    </Card>
}
