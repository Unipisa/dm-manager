import { useState } from 'react'
import { Card, Form, Button, ButtonGroup } from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { BooleanInput, ListInput, PersonInput, RoomInput, GrantInput, DateInput, SelectInput, StringInput, TextInput, MultipleSelectInput, NumberInput } from './Input'

const RESERVED_FIELDS = ['_id', '__v', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt']

export function SchemaInput({ field, schema, value, setValue, edit}) {
    if (schema.type === 'array') {
        const label = schema.items.label || field
        if (schema.enum) {
            return <MultipleSelectInput options={schema.enum} label={label} value={value} setValue={setValue} edit={edit}></MultipleSelectInput>
        }
        if (!schema.items['x-ref']) return <ListInput label={label} value={value} setValue={setValue} edit={edit}/>
        if (schema.items['x-ref'] === 'Person') return <PersonInput multiple label={label} value={value} setValue={setValue} edit={edit} />
        if (schema.items['x-ref'] === 'Grant') return <GrantInput multiple label={label} value={value} setValue={setValue} edit={edit} />        
        return <p>x-ref to {schema.items['x-ref']} not yet implemented in array</p>
    } else {
        const label = schema.label || field
        if (schema['x-ref'] === 'Person') return <PersonInput label={label} value={value} setValue={setValue} edit={edit} />
        if (schema['x-ref'] === 'Room') return <RoomInput label={label} value={value} setValue={setValue} edit={edit} />
        if (schema['x-ref']) return <p>x-ref to {schema['x-ref']} not yet implemented</p> 
        if (schema.format === 'date-time') return <DateInput label={label} value={value} setValue={setValue} edit={edit} />
        if (schema.enum) return <SelectInput options={schema.enum} label={label} value={value} setValue={setValue} edit={edit} />
        if (schema.type === 'string') {
            if (schema.widget === 'text') return <TextInput label={label} value={value} setValue={setValue} edit={edit}/>
            else return <StringInput label={label} value={value} setValue={setValue} edit={edit}/>
        } else if (schema.type === 'number') {
            return <NumberInput label={label} value={value} setValue={setValue} edit={edit}/>
        }
        if (schema.type === 'boolean') return <BooleanInput label={label} value={value} setValue={setValue} edit={edit}/>
        return <span>unknown input type {JSON.stringify(schema)}</span>
    }
}

export function SchemaInputs({ schema, obj, setObj, onChange, edit}) {
    let lst = []
    for (let [field, field_schema] of Object.entries(schema)) {
        if (RESERVED_FIELDS.includes(field)) continue

        const setValue = value => {
            if (onChange && onChange(field, value)) return
            setObj(obj => ({...obj, [field]: value}))
        }
        lst.push(<SchemaInput key={field} field={field} schema={field_schema} value={obj[field]} setValue={setValue} edit={edit} />)
    }        
    return lst
}

export function emptyObject(Model) {
    const empty = {}
    for (let [field, Field] of Object.entries(Model.fields)) {
        if (RESERVED_FIELDS.includes(field)) continue
        if (Field['type'] === 'array') empty[field] = []
        else if (Field['x-ref']) empty[field] = null
        else if (Field['default']) empty[field] = Field['default']
        else if (Field['enum']) empty[field] = Field['enum'][0]
        else empty[field] = ''
    }
    return empty
}

function Timestamps({ obj, oa }) {
    oa = oa || 'o'
    return <>
        <p style={{align: "right"}}>
            Creat{oa} da <b>{obj.createdBy?.username || '???'}</b> 
            {' '}il <b>{myDateFormat(obj.createdAt)}</b>
        <br />
            Modificat{oa} da <b>{obj.updatedBy?.username || '???'}</b> 
            {' '}il <b>{myDateFormat(obj.updatedAt)}</b>
        </p>
    </>
}

export default function ModelForm({ Model, original }) {
    const create = (original._id === undefined)
    const [ edit, setEdit ] = useState(create)
    const Details = Model.ObjectDetails
    const objName = Model.name
    const oa = Model.oa 
    const describe = Model.describe.bind(Model)

    if (edit) return <>
        <Card>
            <Card.Header>
                <h3>{ `nuov${oa} ${objName}` }</h3>
            </Card.Header>
            <Card.Body>
                <ModelEdit Model={Model} obj={original} setEdit={setEdit}/>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={original} />
            </Card.Footer>
        </Card>
    </>
    
    if (!edit) return <>
        <Card>
            <Card.Header>
                <h3>{ `${objName} ${describe(original)}` }</h3>
            </Card.Header>
            <Card.Body>
                <ModelView Model={Model} create={create} edit={edit} obj={original} setEdit={setEdit}/>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={original} />
            </Card.Footer>
        </Card>
        { Details && <Details obj={original} /> }
    </>
}

function ModelView({Model, obj, setEdit}) {
    const navigate = useNavigate()

    return <>
        <SchemaInputs 
                schema={Model.schema.fields} 
                obj={obj} 
                edit={false}
            />
        <ButtonGroup>
            <Button 
                onClick={ () => setEdit(true) }
                className="btn-warning">
                modifica
            </Button>
            <Button 
                onClick={ () => navigate(-1) }
                className="btn btn-secondary">
                    torna all'elenco
            </Button>
        </ButtonGroup>
    </>
}

function ModelEdit({Model, obj, setEdit}) {
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
        setRedirect(indexUrl)
    })
    const patchObj = engine.usePatch(objCode, (response) => {
        engine.addInfoMessage(`${objName} ${describe(modifiedObj)} modificat${oa}`)
        setRedirect(indexUrl)
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
            <SchemaInputs schema={engine.Models[ModelName].schema.fields} obj={modifiedObj} setObj={setModifiedObj} onChange={onChange && onChange(setModifiedObj)} edit={true}/>
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
                    onClick={ () => deleteObj(modifiedObj) }
                    className="btn btn-danger pull-right">
                        elimina {objName}
                </Button>}
            </ButtonGroup>
        </Form>
    </>
}
