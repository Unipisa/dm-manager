import { myDateFormat } from '../Engine'
import { BooleanInput, ListInput, PersonInput, RoomInput, GrantInput, DateInput, SelectInput, StringInput, TextInput, MultipleSelectInput, NumberInput, MultipleSelectOutput } from './Input'

const RESERVED_FIELDS = ['_id', '__v', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt']

export function ModelInput({ field, schema, value, setValue}) {
    const edit = true
    if (schema.type === 'array') {
        const label = schema.items.label || field
        if (schema.enum) {
            return <MultipleSelectInput options={schema.enum} label={label} value={value} setValue={setValue} />
        }
        if (!schema.items['x-ref']) return <ListInput label={label} value={value} setValue={setValue} />
        if (schema.items['x-ref'] === 'Person') return <PersonInput multiple label={label} value={value} setValue={setValue} />
        if (schema.items['x-ref'] === 'Grant') return <GrantInput multiple label={label} value={value} setValue={setValue} />        
        return <p>x-ref to {schema.items['x-ref']} not yet implemented in array</p>
    } else {
        const label = schema.label || field
        if (schema['x-ref'] === 'Person') return <PersonInput label={label} value={value} setValue={setValue} />
        if (schema['x-ref'] === 'Room') return <RoomInput label={label} value={value} setValue={setValue} />
        if (schema['x-ref']) return <p>x-ref to {schema['x-ref']} not yet implemented</p> 
        if (schema.format === 'date-time') return <DateInput label={label} value={value} setValue={setValue} />
        if (schema.enum) return <SelectInput options={schema.enum} label={label} value={value} setValue={setValue} />
        if (schema.type === 'string') {
            if (schema.widget === 'text') return <TextInput label={label} value={value} setValue={setValue} />
            else return <StringInput label={label} value={value} setValue={setValue} />
        } else if (schema.type === 'number') {
            return <NumberInput label={label} value={value} setValue={setValue} />
        }
        if (schema.type === 'boolean') return <BooleanInput label={label} value={value} setValue={setValue} />
        return <span>unknown input type {JSON.stringify(schema)}</span>
    }
}

export function ModelInputs({ schema, obj, setObj, onChange}) {
    let lst = []
    for (let [field, field_schema] of Object.entries(schema)) {
        if (RESERVED_FIELDS.includes(field)) continue

        const setValue = value => {
            if (onChange && onChange(field, value)) return
            setObj(obj => ({...obj, [field]: value}))
        }
        lst.push(<ModelInput key={field} field={field} schema={field_schema} value={obj[field]} setValue={setValue} edit={true} />)
    }        
    return lst
}

export function ModelOutput({ field, schema, value}) {
    function render(value, xref) {
        if (!xref) return value
        if (xref === 'Person') return `${value.firstName} ${value.lastName} (${value.affiliation})`
        if (xref === 'Grant') return `${value.name} (${value.pi ? value.pi.lastName : ''} - ${value.identifier})`
        if (xref === 'Room') return `${value.code}`
        return `x-ref to ${xref} not yet implemented`
    }
    if (schema.type === 'array') {
        if (schema.enum) {
            return value.join(', ')
        }
        if (value === undefined || value === null) return '???'
        return value
            .map(v => render(v, schema.items['x-ref']))
            .join(', ')
    } else {
        if (schema['x-ref']) return render(value, schema['x-ref'])
        if (schema.format === 'date-time') return myDateFormat(value)
        if (schema.enum) return value
        if (schema.type === 'string') {
            if (value === undefined || value === null) return '???'
            if (schema.widget === 'text') return value.split('\n').map((line,i) => <p key={i}>{line}</p>)
            else return value
        } 
        if (schema.type === 'number') {
            return value
        }
        if (schema.type === 'boolean') return value ? "sì" : "no"
        return <span>unknown output type {JSON.stringify(schema)}</span>
    }
}

export function ModelOutputs({ schema, obj}) {
    let lst = []
    for (let [field, field_schema] of Object.entries(schema)) {
        if (RESERVED_FIELDS.includes(field)) continue
        const label = field_schema.items?.label || field_schema.label || field
        lst.push(<div key={field}>
            <b>{label}: </b>
            <ModelOutput key={field} field={field} schema={field_schema} value={obj[field]} />
        </div>)
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


