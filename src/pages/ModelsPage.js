import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'

import { useEngine, myDateFormat, useQueryFilter } from '../Engine'
import { Th } from '../components/Table'
import Loading from '../components/Loading'

export default function ModelsPage({ Model, columns }) {
    const filter = useQueryFilter(Model.indexDefaultFilter)
    const engine = useEngine()
    const query = engine.useIndex(Model.code, filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        Model.pageUrl(obj._id), {replace: false}), [navigate, Model])

    if (query.isLoading) return <Loading />
    if (!query.isSuccess) return null

    const data = query.data.data

    const modelFields = engine.Models[Model.ModelName].schema.fields
    
    // console.log(`MODELFIELDS: ${JSON.stringify(modelFields)}`)

    columns = columns || Model.columns

    function displayField(obj, key) {
        let value = obj[key]
        if (value === undefined) return ''
        if (value === null) return '---'
        const field = modelFields[key]
        if (field && field.type === 'array') {
            if (field.items['x-ref'] === 'Person') {
                return value.map(person => `${person.lastName}`).join(', ')
            }
            return value.join(', ')
        }
        if (field && field.format === 'date-time') return myDateFormat(value)
        if (key === 'roomAssignment') return `${value.room.code}`
        const xref = field && field['x-ref'] 
        if (xref === 'Person') {
            return `${value.lastName} ${value.firstName}`
        } else if (xref === 'Room') {
            return `${value.code}`
        } else if (xref) {
            return `${xref} not implemented`
        }
        return value
    }

    function updateFilter(evt) {
        let text = evt.target.value
        console.log(text)

        filter.setFilter(filter => ({
            ...filter, 
            "_search": text
        }))
    }

    return <>
        <div>
            <div className="d-flex mb-4">
                <input onChange={updateFilter} className="form-control" placeholder="Search..."></input>
                { engine.user.hasSomeRole(...Model.schema.managerRoles) && <Link className="mx-2 btn btn-primary text-nowrap" to={Model.pageUrl('new')}>aggiungi {Model.name}</Link>}
            </div>
            <Table hover>
                <thead className="thead-dark">
                    <tr>
                        {
                            Object.entries(columns).map(([key, label]) => 
                                <Th key={key} filter={filter.header(key)}>{label}</Th>)
                        }
                    </tr>
                </thead>
                <tbody>
                    { 
                    data.map(obj => {
                            const handleMouseDown = (evt) => {
                                switch (evt.button) {
                                    case 0:
                                        navigateTo(obj)
                                        break
                                    case 1:
                                        // It is currently unclear if this can be handled with React router
                                        // directly, or we can simply call window.open.
                                        window.open(Model.pageUrl(obj._id), '_blank')
                                        break
                                    default:
                                        // NOOP
                                }
                            }

                            return <tr key={obj._id} onMouseDown={handleMouseDown} >
                                {
                                    Object.entries(columns).map(([key, label]) =>
                                    <td key={key}>{ displayField(obj, key) }</td>)
                                }
                            </tr>
                        })
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