import { useCallback, useRef, useState } from 'react'
import { Table, Button } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'

import { useEngine, myDateFormat, useQueryFilter } from '../Engine'
import { Th } from '../components/Table'
import Loading from '../components/Loading'

export default function ModelsPage({ Model, columns }) {
    const filter = useQueryFilter(Model.indexDefaultFilter || {})
    const engine = useEngine()
    const query = engine.useIndex(Model.code, filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        Model.viewUrl(obj._id), {replace: false}), [navigate, Model])
    const scrollRef = useRef(null)
    const [selectedIds, setSelectedIds] = useState([])

    /*
     * infite loop!
    useEffect(() => {
        const observer = new IntersectionObserver(() => {
            console.log(`Intersection observer fired`)
            if (!query.isSuccess) return
            if (query.data.data.length >= query.data.total) return
            if (filter._limit >= query.data.total) return
            console.log(`extendLimit (${query.data.data.length} / ${query.data.total})`)
            filter.extendLimit()
        })
        if (scrollRef.current) observer.observe(scrollRef.current)
        //return () => observer.unobserve(scrollRef.current)
    }, [scrollRef])
    */

    if (query.isLoading) return <Loading />
    if (!query.isSuccess) return null

    const data = query.data.data

    const modelFields = Model.schema.fields
    
    // console.log(`MODELFIELDS: ${JSON.stringify(modelFields)}`)

    columns = columns || Model.columns

    function updateFilter(evt) {
        let text = evt.target.value
        console.log(text)

        filter.setFilter(filter => ({
            ...filter, 
            "_search": text
        }))
    }

    function handleMouseDown(evt, obj) {
        function openInNewTab(obj) {
            // It is currently unclear if this can be handled with React router
            // directly, or we can simply call window.open.
            window.open(Model.viewUrl(obj._id), '_blank')
        }

        if (evt.ctrlKey) {
            if (evt.button === 0) {
                setSelectedIds(lst => {
                    if (lst.includes(obj._id)) {
                        return lst.filter(id => id !== obj._id)
                    } else {
                        return [...lst, obj._id]
                    }
                })
            }
        } else if (evt.altKey || evt.metaKey) {
            if (evt.button ===0) openInNewTab(obj)
        } else {
            if (evt.button === 0) navigateTo(obj)
            else if (evt.button === 1) openInNewTab(obj)
        }
    }

    return <>
        <div>
            <div className="d-flex mb-4">
                <input onChange={updateFilter} className="form-control" placeholder="Search..."></input>
                { engine.user.hasSomeRole(...Model.schema.managerRoles) && <Link className="mx-2 btn btn-primary text-nowrap" to={Model.editUrl('new')}>aggiungi {Model.name}</Link>}
            </div>            
            <div className="d-flex mb-4">
                { selectedIds.length>0 
                    ? <>
                    {selectedIds.length} righe selezionate
                    </>
                    : `usa ctrl-click per selezionare una riga` && ''}
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
                    { data.map(obj => 
                        <tr className={selectedIds.includes(obj._id)?"bg-warning":""} key={obj._id} onMouseDown={evt => handleMouseDown(evt, obj)} >
                            {
                                Object.entries(columns).map(([key, label]) =>
                                <td key={key}>{ displayField(obj, key, modelFields) }</td>)
                            }
                        </tr>)}
                </tbody>
            </Table>
            <p>Visualizzat{Model.oa === "o" ? "i" : "e"} {data.length}/{query.data.total} {Model.names}.</p>
            { query.data.limit < query.data.total
                && <Button ref={scrollRef} onClick={ filter.extendLimit }>visualizza altri</Button>
            }
        </div>
    </>
}

function displayField(obj, key, modelFields) {
    let value = obj[key]
    if (value === undefined) return '???'
    if (value === null) return '---'
    if (key === 'roomAssignment') return `${value.room.code}`
    if (key === 'roomAssignments') return value.map(ra => `${ra.person.lastName}`).join(', ')
    const field = modelFields[key]
    if (field && field.type === 'array') {
        if (field.items['x-ref'] === 'Person') {
            return value.map(person => `${person.lastName}`).join(', ')
        }
        return value.join(', ')
    }
    if (field && field.format === 'date-time') return myDateFormat(value)
    const xref = field && field['x-ref'] 
    if (xref === 'Person') {
        return `${value.lastName} ${value.firstName}`
    } else if (xref === 'Room') {
        return `${value.code}`
    } else if (xref) {
        return `${xref} not implemented`
    }
    if (typeof value === 'object') return JSON.stringify(value)
    return value
}
