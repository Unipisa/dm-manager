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

    const changed = Object.entries(modifiedObj).some(([key, val])=>{
            return val !== obj[key]})

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
            <ModelInputs schema={engine.Models[ModelName].schema.fields} obj={modifiedObj} setObj={setModifiedObj} onChange={onChange && onChange(setModifiedObj)} edit={true}/>
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
