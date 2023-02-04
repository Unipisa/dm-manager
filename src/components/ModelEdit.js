import { useState } from 'react'
import { Form, Button, ButtonGroup } from 'react-bootstrap'
import { Navigate } from 'react-router-dom'

import { useEngine } from '../Engine'
import { ModelInputs } from '../components/ModelInput'

export default function ModelEdit({Model, obj}) {
    const create = (obj._id === undefined)
    const [modifiedObj, setModifiedObj] = useState(obj)
    const objCode = Model.code
    const objName = Model.name
    const indexUrl = Model.indexUrl()
    const oa = Model.oa 
    const describe = Model.describe.bind(Model)
    const onChange = Model.onObjectChange.bind(Model)
    const ModelName = Model.ModelName
    const engine = useEngine()
    const [ redirect, setRedirect ] = useState(null)
    const putObj = engine.usePut(objCode, (obj) => {
        engine.addInfoMessage(`nuov${oa} ${objName} ${describe(obj)} inserit${oa}`)
        setRedirect(Model.viewUrl(obj._id))
    })
    const patchObj = engine.usePatch(objCode, (response) => {
        engine.addInfoMessage(`${objName} ${describe(modifiedObj)} modificat${oa}`)
        setRedirect(Model.viewUrl(modifiedObj._id))
    })
    const deleteObj = engine.useDelete(objCode, (response, obj) => {
        engine.addWarningMessage(`${objName} ${describe(obj)} eliminat${oa}`)
        setRedirect(indexUrl)
    })

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
        .filter(key => !compareValue(modifiedObj[key], obj[key]))

    const changed = modifiedFields.length > 0
    /*
    modifiedFields.forEach(key => {
        console.log(`modified field: ${key} ${typeof(obj[key])}:${JSON.stringify(obj[key])} -> ${typeof(modifiedObj[key])}:${JSON.stringify(modifiedObj[key])}`)
    })
    */

    const submit = async (evt) => {
        console.log(`SUBMIT. obj: ${JSON.stringify(obj)} obj: ${JSON.stringify(modifiedObj)}`)
        if (modifiedObj._id) {
            let payload = Object.fromEntries(Object.keys(obj)
                .filter(key => modifiedObj[key]!==obj[key])
                .map(key => ([key, modifiedObj[key]])))
            payload._id = modifiedObj._id
            patchObj(payload)
        } else {
            putObj(modifiedObj)
        }
    }

    if (redirect !== null) return <Navigate to={redirect} />

    // console.log(`ModelPage obj: ${JSON.stringify(obj)}`)

    return <>
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
                    onClick={ () => setRedirect(create ? Model.indexUrl(obj._id) : Model.viewUrl(obj._id)) }
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
    </>
}
