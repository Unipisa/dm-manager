import { useState } from 'react'
import { Card, Form, Button, ButtonGroup } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { ListInput, PersonInput, DateInput, SelectInput, StringInput } from '../components/Input'

const RESERVED_FIELDS = ['_id', '__v', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt']

export function SchemaInput({ schema, label, value, setValue, edit}) {
    const type = schema['type']
    if (type === 'array') {
        const xref = schema.items['x-ref']
        if (!xref) return <ListInput label={label} value={value} setValue={setValue} edit={edit}/>
        if (xref === 'Person') return <PersonInput multiple label={label} value={value} setValue={setValue} edit={edit} />
        return <p>x-ref to {xref} not yet implemented in array</p>
    }
    const xref = schema['x-ref']
    const format = schema['format']
    if (xref === 'Person') return <PersonInput label={label} value={value} setValue={setValue} edit={edit} />
    if (xref) return <p>x-ref to {xref} not yet implemented</p> 
    if (format === 'date-time') return <DateInput label={label} value={value} setValue={setValue} edit={edit} />
    const enum_ = schema['enum']
    if (enum_) return <SelectInput options={enum_} label={label} value={value} setValue={setValue} edit={edit} />
    if (type === 'string') return <StringInput label={label} value={value} setValue={setValue} edit={edit}/>
    return <span>unknown input type {JSON.stringify(schema)}</span>
}

export function SchemaInputs({ schema, labels, obj, setObj, onChange, edit}) {
    let lst = []
    for (let [field, field_schema] of Object.entries(schema)) {
        if (RESERVED_FIELDS.includes(field)) continue

        const setValue = value => {
            if (onChange && onChange(field, value)) return
            setObj(obj => ({...obj, [field]: value}))
        }
        console.log(`field: ${field}, value: ${JSON.stringify(obj[field])}`)
        lst.push(<SchemaInput key={field} schema={field_schema} value={obj[field]} setValue={setValue} label={(labels && labels[field]) || field} edit={edit} />)
        // lst.push(<p>{field}:  {JSON.stringify(field_schema)}</p>)
    }        
    return lst
}

export function emptyObject(Model) {
    const empty = {}
    for (let [field, Field] of Object.entries(Model)) {
        if (RESERVED_FIELDS.includes(field)) continue
        if (Field['type'] === 'array') empty[field] = []
        else if (Field['x-ref']) empty[field] = null
        else empty[field] = ''
    }
    console.log(`Empty: ${JSON.stringify(empty)}`)
    return empty
}

export default function ModelPage({ objCode, objName, indexUrl, oa, describe, onChange, ModelName }) {
    const engine = useEngine()
    const empty = emptyObject(engine.Models[ModelName])
    const { id } = useParams()
    const create = (id === 'new')
    const [ edit, setEdit ] = useState(create)
    const [ obj, setObj ] = useState(create ? empty : null)
    const [ redirect, setRedirect ] = useState(null)
    const query = engine.useGet(objCode, id)
    const putObj = engine.usePut(objCode, (obj) => {
        engine.addInfoMessage(`nuov${oa} ${objName} ${describe(obj)} inserit${oa}`)
        setRedirect(indexUrl)
    })
    const patchObj = engine.usePatch(objCode, (response) => {
        engine.addInfoMessage(`${objName} ${describe(obj)} modificat${oa}`)
        setRedirect(indexUrl)
    })
    const deleteObj = engine.useDelete(objCode, (response, obj) => {
        engine.addWarningMessage(`${objName} ${describe(obj)} eliminat${oa}`)
        setRedirect(indexUrl)
    })

    if (obj === null) {
        if (query.isSuccess) {
            setObj(query.data)
        }
        return <div>caricamento...</div>
    }

    const original = create ? empty : query.data

    const changed = Object.entries(obj).some(([key, val])=>{
            return val !== original[key]})

    const submit = async (evt) => {
        if (obj._id) {
            let payload = Object.fromEntries(Object.keys(empty)
                .filter(key => obj[key]!==original[key])
                .map(key => ([key, obj[key]])))
            payload._id = obj._id
            patchObj(payload)
        } else {
            putObj(obj)
        }
    }

    if (redirect !== null) return <Navigate to={redirect} />

    return <Card>
        <Card.Header>
            <h3>{ create ? `nuov${oa} ${objName}` : `${objName} ${describe(obj)}` }</h3>
        </Card.Header>
        <Card.Body>
        <Form onSubmit={ (event) => event.preventDefault() }>
            <SchemaInputs schema={engine.Models[ModelName]} obj={obj} setObj={setObj} onChange={onChange && onChange(setObj)} edit={edit}/>
            { edit ?
                <ButtonGroup className="mt-3">
                    <Button 
                        onClick={ submit } 
                        className="btn-primary"
                        disabled= { !changed }>
                        {create?`aggiungi ${objName}`:`salva modifiche`}
                    </Button>
                    <Button 
                        onClick={ () => setRedirect(indexUrl)}
                        className="btn btn-secondary">
                        { changed ? `annulla modifiche` : `torna all'elenco`}
                    </Button>
                    {!create && <Button
                        onClick={ () => deleteObj(obj) }
                        className="btn btn-danger pull-right">
                            elimina {objName}
                    </Button>}
                </ButtonGroup>
            : <ButtonGroup>
                <Button 
                    onClick={ () => setEdit(true) }
                    className="btn-warning">
                    modifica
                </Button>
                <Button 
                    onClick={ () => setRedirect(indexUrl)}
                    className="btn btn-secondary">
                        torna all'elenco
                </Button>
            </ButtonGroup>
            }
            </Form>
        <br />
        <p style={{align: "right"}}>
            Creato da <b>{obj.createdBy?.username}</b> 
            {' '}il <b>{myDateFormat(obj.createdAt)}</b>
        <br />
            Modificato da <b>{obj.updatedBy?.username}</b> 
            {' '}il <b>{myDateFormat(obj.updatedAt)}</b>
        </p>
        </Card.Body>
    </Card>
}
