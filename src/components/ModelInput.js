import { useId } from 'react'
import { Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import { myDateFormat, useEngine } from '../Engine'
import { InstitutionInput, BooleanInput, ListInput, PersonInput, RoomInput, GrantInput, DateInput, SelectInput, StringInput, TextInput, MultipleSelectInput, NumberInput, AttachmentInput, ImageInput } from './Input'

const RESERVED_FIELDS = ['_id', '__v', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt']

export function ModelInput({ field, modified, schema, value, setValue}) {
    const id = useId()
    function element(Element, opts = {}) {
        const {options, multiple} = opts
        const label = schema.items?.label || schema.label || field
        return <Form.Group className="row my-2">
            <Form.Label className={ "col-sm-2 " + (modified ? "bg-warning" : "") } htmlFor={ id } style={{textAlign: "right"}}>
                { label }
            </Form.Label>
            <div className="col-sm-10">
                <Element 
                    id={id}
                    value={value} 
                    setValue={setValue} 
                    options={options}
                    multiple={multiple}
                />                         
            </div>
            <div className="col-sm-2"></div>
            <div className="col-sm-10 form-text">{schema.help}</div>
        </Form.Group>
    }

    if (schema.type === 'array') {
        if (schema.enum) return element(MultipleSelectInput, {options: schema.enum})
        if (!schema.items['x-ref']) return element(ListInput)
        if (schema.items['x-ref'] === 'Person') return element(PersonInput, {multiple:true})
        if (schema.items['x-ref'] === 'Grant') return element(GrantInput, {multiple:true})        
        if (schema.items['x-ref'] === 'Institution') return element(InstitutionInput, {multiple:true})
        return <p>x-ref to {schema.items['x-ref']} not yet implemented in array</p>
    } else {
        if (schema['x-ref'] === 'Person') return element(PersonInput)
        if (schema['x-ref'] === 'Room') return element(RoomInput)
        if (schema['x-ref'] === 'Institution') return element(InstitutionInput)
        if (schema['x-ref']) return <p>x-ref to {schema['x-ref']} not yet implemented</p> 
        if (schema.format === 'date-time') return element(DateInput)
        if (schema.enum) return element(SelectInput, {options: schema.enum})
        if (schema.type === 'number') return element(NumberInput)
        if (schema.type === 'boolean') return element(BooleanInput)
        if (schema.type === 'string') {
            switch (schema.widget) {
                case 'text':
                    return element(TextInput)
                case 'attachment':
                    return element(AttachmentInput)
                case 'image':
                    return element(ImageInput)
                default:
                    return element(StringInput)
            }            
        } 
        return <span>unknown input type {JSON.stringify(schema)}</span>
    }
}

export function ModelInputs({ modifiedFields, schema, obj, setObj, onChange}) {
    let lst = []
    for (let [field, field_schema] of Object.entries(schema)) {
        if (RESERVED_FIELDS.includes(field)) continue

        const setValue = value => {
            if (onChange && onChange(field, value)) return
            setObj(obj => ({...obj, [field]: value}))
        }
        const modified = modifiedFields.includes(field)
        lst.push(<ModelInput modified={modified} key={field} field={field} schema={field_schema} value={obj[field]} setValue={setValue} edit={true} />)
    }        
    return lst
}

export function ModelOutput({ field, schema, value}) {
    const engine = useEngine()
    const Models = engine.Models
    if (value === null) return '---'
    if (value === undefined) return '???'
    function render(value, xref) {
        if (!xref) return value
        const Model = Models[xref]
        if (Model) return <Link key={value._id} to={Model.viewUrl(value._id)}>{Model.describe(value)}</Link>
        return `x-ref to ${xref} not yet implemented`
    }
    if (schema.type === 'array') {
        if (schema.enum) return value.join(', ')
        let lst = []
        value.forEach((v, i) => {
            if (i>0) lst.push(', ')
            lst.push(render(v, schema.items['x-ref']))
        })
        return lst
    } else {
        if (schema['x-ref']) return render(value, schema['x-ref'])
        if (schema.format === 'date-time') return myDateFormat(value)
        if (schema.enum) return value
        if (schema.type === 'string') {
            if (value === undefined || value === null) return '???'
            if (field === 'genealogyId') return <a href={`https://genealogy.math.ndsu.nodak.edu/id.php?id=${value}`}>{value}</a>
            if (schema.widget === 'text') {
                var lst = []
                value.split('\n').forEach((line ,i) => {
                    if (i) lst.push(<br key={i} />)
                    lst.push(line)
                })
                return lst 
            }
            if (schema.widget === 'attachment' || schema.widget === 'url') {
                return <a href={value} target="_blank" rel="noreferrer">{value}</a>
            }
            if (schema.widget === 'image') {
                return <img src={value} alt={value} className="mx-4 rounded" style={{maxWidth: '10em'}} />
            }
            else return value
        } 
        if (schema.type === 'number') {
            return value
        }
        if (schema.type === 'boolean') return value ? "sì" : "no"
        if (schema.type === 'object') return JSON.stringify(value)
        return <span>unknown output type {JSON.stringify(schema)}</span>
    }
}

export function ModelOutputs({ Model, obj}) {
    let lst = []
    const schema = Model.schema.fields
    for (let [field, field_schema] of Object.entries(schema)) {
        if (RESERVED_FIELDS.includes(field)) continue
        const label = field_schema.items?.label || field_schema.label || field
        lst.push(<p key={field}>
            <strong className="align-top">{label}: </strong>
            <ModelOutput key={field} field={field} schema={field_schema} value={obj[field]} />
        </p>)
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


