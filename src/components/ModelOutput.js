import { Link } from 'react-router-dom'

import { myDateFormat, useEngine } from '../Engine'

export const RESERVED_FIELDS = ['_id', '__v', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt']

export function ModelFieldOutput({ field, schema, value }) {
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
            if (schema.href) return <a href={schema.href.replace('{}', value)}>{value}</a>
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

export function ModelOutputs({ Model, obj }) {
    return (
        <>
            {Object.entries(Model.schema.fields)
                .filter(([field]) => !RESERVED_FIELDS.includes(field))
                .map(([field, field_schema]) => (
                    <p key={field}>
                        <strong className="align-top">{field_schema.items?.label || field_schema.label || field}: </strong>
                        <ModelFieldOutput key={field} field={field} schema={field_schema} value={obj[field]} />
                    </p>
                ))}
        </>
    )
}
