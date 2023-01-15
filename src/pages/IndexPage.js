import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'

import { useEngine, myDateFormat, useQueryFilter } from '../Engine'
import { Th } from '../components/Table'

export default function IndexPage({Model}) {
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
    
    // console.log(`MODELFIELDS: ${JSON.stringify(modelFields)}`)

    function displayField(obj, key) {
        let value = obj[key]
        if (value === undefined) return ''
        if (value === null) return '---'
        const field = modelFields[key]
        if (field && field.type === 'array') {
            return value.join(', ')
        }
        if (field && field.format === 'date-time') return myDateFormat(value)
        if (key === 'room') return `${value.room.building} ${value.room.floor}: ${value.room.number}`
        const xref = field && field['x-ref'] 
        if (xref === 'Person') {
            return value.lastName
        } else if (xref === 'Room') {
            return `${value.building} ${value.number} p. ${value.floor}`
        } else if (xref) {
            return `${xref} not implemented`
        }
        return value
    }
    return <>
        <div>
            { engine.user.hasSomeRole(...Model.schema.managerRoles) && <Link className="btn btn-primary" to={Model.pageUrl('new')}>aggiungi {Model.name}</Link> }
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

