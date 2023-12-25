import { RESERVED_FIELDS } from './ModelOutput'

import { 
    InputRow,
    InstitutionInput,
    BooleanInput,
    ListInput,
    PersonInput,
    RoomInput,
    GrantInput,
    DateInput,
    SelectInput,
    StringInput,
    TextInput,
    MultipleSelectInput,
    NumberInput,
    AttachmentInput,
    ImageInput,
    ConferenceRoomInput,
    SeminarCategoryInput
} from './Input'
import { DatetimeInput } from './DatetimeInput'
import { usePrefix } from '../processes/PrefixProvider'

export function ModelFieldInput({ schema, value, setValue }) {
    const api_prefix = usePrefix()
    function element(Element, opts = {}) {
        const {options, multiple} = opts
        return <Element 
                    value={value} 
                    setValue={setValue} 
                    options={options}
                    multiple={multiple}
                />
    }

    if (!schema) return <p>no schema provided</p>

    if (schema.type === 'array') {
        if (schema.enum) return element(MultipleSelectInput, {options: schema.enum})
        if (!schema.items['x-ref']) return element(ListInput)
        if (schema.items['x-ref'] === 'Person') return element(PersonInput, {multiple:true})
        if (schema.items['x-ref'] === 'Grant') return element(GrantInput, {multiple:true})        
        if (schema.items['x-ref'] === 'Institution') return element(InstitutionInput, {multiple:true})
        return <p>x-ref to {schema.items['x-ref']} not yet implemented in array</p>
    } else {
        const xref = schema['x-ref']
        if (xref === 'Person') return element(PersonInput)
        if (xref === 'Room') return element(RoomInput)
        if (xref === 'ConferenceRoom') return element(ConferenceRoomInput)
        if (xref === 'SeminarCategory') return element(SeminarCategoryInput)
        if (xref === 'Institution') return element(InstitutionInput)
        if (xref === 'User') return element(StringInput)
        if (xref) return <p>x-ref to {xref} not yet implemented</p> 
        if (schema.format === 'date-time') {
            if (schema.widget === 'datetime') return element(DatetimeInput) // use formatted text input "YYYY-MM-DD HH:mm"
            return element(DateInput) // use date only widget
        }
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

export function ModelInput({ field, modified, schema, value, setValue}) {
    const label = schema?.items?.label || schema?.label || field
    const help = schema?.help

    return <InputRow label={label} modified={modified} help={help}>
        <ModelFieldInput
            schema={schema}
            value={value} 
            setValue={setValue} 
        />                         
    </InputRow>
}

export function ModelInputs({ modifiedFields, schema, obj, setObj, onChange}) {
    return Object.entries(schema)
        .filter(([field]) => !RESERVED_FIELDS.includes(field))
        .map(([field, field_schema]) => (
            <ModelInput 
                modified={modifiedFields.includes(field)}
                key={field}
                field={field}
                schema={field_schema}
                value={obj[field]}
                setValue={value => {
                    if (onChange?.(field, value)) return
                    setObj(obj => ({...obj, [field]: value}))
                }}
                edit={true} />
        ))
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


