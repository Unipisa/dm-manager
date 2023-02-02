import { BooleanInput, ListInput, PersonInput, RoomInput, GrantInput, DateInput, SelectInput, StringInput, TextInput, MultipleSelectInput, NumberInput } from './Input'

const RESERVED_FIELDS = ['_id', '__v', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt']

export function ModelInput({ field, schema, value, setValue, edit}) {
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

export function ModelInputs({ schema, obj, setObj, onChange, edit}) {
    let lst = []
    for (let [field, field_schema] of Object.entries(schema)) {
        if (RESERVED_FIELDS.includes(field)) continue

        const setValue = value => {
            if (onChange && onChange(field, value)) return
            setObj(obj => ({...obj, [field]: value}))
        }
        lst.push(<ModelInput key={field} field={field} schema={field_schema} value={obj[field]} setValue={setValue} edit={edit} />)
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


