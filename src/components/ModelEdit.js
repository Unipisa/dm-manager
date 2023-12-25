import { useState } from 'react'
import { Form, Button, ButtonGroup } from 'react-bootstrap'
import { Card } from 'react-bootstrap'

import { useEngine } from '../Engine'
import { ModelInput, ModelInputs } from '../components/ModelInput'
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
    const {useGet, usePut, usePatch, useDelete, addWarningMessage, addInfoMessage} = useEngine()
    const putObj = usePut(objCode)
    const patchObj = usePatch(objCode)
    const engineDeleteObj = useDelete(objCode)

    async function deleteObj(obj) {
        await engineDeleteObj(obj)
        addWarningMessage(`${objName} ${describe(obj)} eliminat${oa}`)
        onDelete ? onDelete() : onCancel()
    }

    const query = useGet(Model.code, id)
    const queryClone = useGet(Model.code, clone_id ? clone_id : null)

    if (query.isError || queryClone.isError) return <div>errore caricamento</div>
    if (query.isLoading || queryClone.isLoading) return <Loading />
    if (modifiedObj === null) {
        if (clone_id) {
            if (queryClone.isSuccess) setModifiedObj({...queryClone.data, _id: undefined})
        } else {
            if (query.isSuccess) setModifiedObj({...query.data})
        }
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

    const modifiedFields = [...Object.keys(modifiedObj)]
        .filter(key => !compareValue(modifiedObj[key], originalObj[key]))
    console.log(`Modified fields: ${JSON.stringify(modifiedFields)}`)

    const changed = modifiedFields.length > 0

    const submit = async (evt) => {
        // console.log(`SUBMIT. originalObj: ${JSON.stringify(originalObj)} ModifiedObj: ${JSON.stringify(modifiedObj)}`)
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
            await patchObj(payload)
            addInfoMessage(`${objName} ${describe(obj)} modificat${oa}`)
            onSave(obj)
        } else {
            /**
             * unable to get the result from putObj
             * we should return after that
             */
            const resultObj = await putObj(obj)
            addInfoMessage(`nuov${oa} ${objName} ${describe(resultObj)} inserit${oa}`)
            onSave(resultObj)
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
            { /* input speciale per modificare il campo createdBy */
                originalObj.createdBy === undefined && !create && 
                <ModelInput 
                    schema={{
                        label: 'Creato da',
                        ...Model.schema.fields.createdBy}} 
                    setValue={(value) => {
                            setModifiedObj(obj => ({...obj, createdBy: value}))
                        }}
                    edit={true}
                    value={modifiedObj.createdBy}
                    obj={modifiedObj} 
                    setObj={setModifiedObj} 
                    modified={modifiedFields.includes("createdBy")}
                    onChange={onChange && onChange(setModifiedObj)} 
            />}
            <ButtonGroup className="mt-3">
                <Button 
                    onClick={ submit } 
                    className="btn-primary"
                    disabled= { !changed }>
                    {create ? `aggiungi ${objName}` : `salva modifiche`}
                </Button>
                <Button 
                    onClick={ () => onCancel(originalObj) }
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
            <Timestamps obj={originalObj}/>
        </Card.Footer>
    </Card>
}
