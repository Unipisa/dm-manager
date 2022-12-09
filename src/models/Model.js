import { useState, useCallback } from 'react'
import { Card, Form, Table, Button, ButtonGroup } from 'react-bootstrap'
import { Route, useParams, useNavigate, Link, Navigate } from 'react-router-dom'

import { useEngine, myDateFormat, useQueryFilter } from '../Engine'
import { Th } from '../components/Table'
import { BooleanInput, ListInput, PersonInput, DateInput, SelectInput, StringInput, TextInput } from '../components/Input'

const RESERVED_FIELDS = ['_id', '__v', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt']

export function SchemaInput({ field, schema, value, setValue, edit}) {
    if (schema.type === 'array') {
        const label = schema.items.label || field
        if (!schema.items['x-ref']) return <ListInput label={label} value={value} setValue={setValue} edit={edit}/>
        if (schema.items['x-ref'] === 'Person') return <PersonInput multiple label={label} value={value} setValue={setValue} edit={edit} />
        return <p>x-ref to {schema.items['x-ref']} not yet implemented in array</p>
    } else {
        const label = schema.label || field
        if (schema['x-ref'] === 'Person') return <PersonInput label={label} value={value} setValue={setValue} edit={edit} />
        if (schema['x-ref']) return <p>x-ref to {schema['x-ref']} not yet implemented</p> 
        if (schema.format === 'date-time') return <DateInput label={label} value={value} setValue={setValue} edit={edit} />
        if (schema.enum) return <SelectInput options={schema.enum} label={label} value={value} setValue={setValue} edit={edit} />
        if (schema.type === 'string') {
            if (schema.widget === 'text') return <TextInput label={label} value={value} setValue={setValue} edit={edit}/>
            else return <StringInput label={label} value={value} setValue={setValue} edit={edit}/>
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

function ModelPage({ objCode, objName, indexUrl, oa, describe, onChange, ModelName, Details }) {
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
        console.log(`SUBMIT. Empty: ${JSON.stringify(empty)} original: ${JSON.stringify(original)} obj: ${JSON.stringify(obj)}`)
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

    // console.log(`ModelPage obj: ${JSON.stringify(obj)}`)

    return <>
    <Card>
        <Card.Header>
            <h3>{ create ? `nuov${oa} ${objName}` : `${objName} ${describe(obj)}` }</h3>
        </Card.Header>
        <Card.Body>
        <Form onSubmit={ (event) => event.preventDefault() }>
            <SchemaInputs schema={engine.Models[ModelName].fields} obj={obj} setObj={setObj} onChange={onChange && onChange(setObj)} edit={edit}/>
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
    { Details && !edit && <Details obj={obj}/>}
    </>
}

function IndexPage({Model}) {
    const filter = useQueryFilter(Model.indexDefaultFilter)
    const engine = useEngine()
    const query = engine.useIndex(Model.code, filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        Model.pageUrl(obj._id), {replace: true}), [navigate, Model])

    if (query.isLoading) return <span>loading...</span>
    if (!query.isSuccess) return null

    const data = query.data.data

    const modelFields = engine.Models[Model.ModelName].fields
    
    console.log(`MODELFIELDS: ${JSON.stringify(modelFields)}`)

    function displayField(obj, key) {
        let value = obj[key]
        if (value === undefined) return ''
        if (value === null) return '---'
        if (modelFields[key].type === 'array') {
            return value.join(', ')
        }
        if (modelFields[key].format === 'date-time') return myDateFormat(value)
        if (modelFields[key]['x-ref'] === 'Person') {
            return value.lastName
        }
        return value
    }

    return <>
        <div>
            { engine.user.hasSomeRole(...Model.managerRoles) && <Link className="btn btn-primary" to={Model.pageUrl('new')}>aggiungi {Model.name}</Link> }
            <Table hover>
                <thead className="thead-dark">
                    <tr>
                        {
                            Object.entries(Model.columns).map(([key, label]) => 
                                <Th key={key} filter={filter.header(key)}>{label}</Th>)
                        }
                    </tr>
                </thead>
                <tbody>
                    { 
                    data.map(obj =>
                        <tr key={obj._id} onClick={()=>navigateTo(obj)}>
                            {
                                Object.entries(Model.columns).map(([key, label]) => 
                                <td key={key}>{ displayField(obj, key) }</td>)
                            }
                        </tr>) 
                    }
                </tbody>
            </Table>
            <p>Visualizzat{Model.oa === "o" ? "i" : "e"} {data.length}/{query.data.total} {Model.names}.</p>
            { query.data.limit < query.data.total
                && <Button onClick={ filter.extendLimit }>visualizza altri</Button>
            }
        </div>
    </>
}

export default class Model {
    // string identifier of model
    static code = null 
    
    // italian name of model
    static name = null 

    // italian gender identifier
    static oa = "o"

    // brief description of given object
    static describe(obj) { return "<object description not implemented>"}

    // absolute url of objects index
    static indexUrl() {return `/${this.code}`}
    
    // absolute url of object with given id
    static pageUrl(id) {return `/${this.code}/${id}`}

    static onObjectChange(setObj) {}

    // react element with more details on given object
    static ObjectDetails(obj) {
        return null
    }

    // initial filter of index page
    static indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}

    // roles which have manage privilege
    static managerRoles = ['admin']

    // columns in index page: {key: label}
    static columns = {}

    // react object page element
    static Page() {
        return <ModelPage
            ModelName = { this.ModelName }
            objCode = { this.code }
            objName = { this.name }
            indexUrl = { this.indexUrl() }
            oa = { this.oa }
            describe = { this.describe.bind(this) }
            onChange = { this.onObjectChange.bind(this) }
            Details = { this.ObjectDetails }
        />
    }

    static Index = IndexPage

    // react routers to object pages
    static routers() {
        const Page = this.Page.bind(this)
        const Index = this.Index
        return [
          <Route path={this.pageUrl(":id")} element={<Page />} />,
          <Route path={this.indexUrl()} element={<Index Model={this} />} />
        ]
    }    
}
