import { useCallback, useRef, useState } from 'react'
import { Table, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { CSVLink } from "react-csv"

import { useEngine, myDateFormat, useQueryFilter } from '../Engine'
import Loading from './Loading'

export default function LoadTable({path, defaultFilter, viewUrl, fieldsInfo, addButton, columns, csvHeaders, Filters}) {    
    const engine = useEngine()
    const filter = useQueryFilter(defaultFilter || {})
    const query = engine.useIndex(path, filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        viewUrl(obj), {replace: false}), [navigate, viewUrl])
    const scrollRef = useRef(null)
    const [selectedIds, setSelectedIds] = useState([])
    columns ||= []
    if (Array.isArray(columns)) {
        columns = Object.fromEntries(columns.map(key => [key, key]))
    }
    // convert strings to objects with label
    columns = Object.fromEntries(Object.entries(columns).map((
        [key, label]) => (typeof label === 'string') 
            ? [key, {label}]
            : [key, label]))
    csvHeaders ||= fieldsInfo ? computeCsvHeaders(fieldsInfo): undefined
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

    // console.log(`MODELFIELDS: ${JSON.stringify(fieldsInfo)}`)

    function updateFilter(evt) {
        let text = evt.target.value
        // console.log(text)

        filter.setFilter(filter => ({
            ...filter, 
            "_search": text
        }))
    }

    function handleRowClick(evt, obj) {
        function openInNewTab(obj) {
            // It is currently unclear if this can be handled with React router
            // directly, or we can simply call window.open.
            window.open(viewUrl(obj), '_blank')
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
            if (evt.button === 0 && viewUrl) openInNewTab(obj)
        } else {
            if (evt.button === 0 && viewUrl) navigateTo(obj)
            if (evt.button === 1 && viewUrl) openInNewTab(obj)
        }
    }

    // This style is applied to the table when the data is being fetched / updated, to provide
    // the user with a visual feedback of the operation that is going on; pointerEvents: none ensures
    // that no other sorting / filters are changed in the meantime.
    const fetchingStyle = {
        pointerEvents: "none",
        backgroundColor: '#ccc',
        transition: 'background-color 200ms linear 150ms'
    }

    return <>
        <div>
            <div className="d-flex mb-4">
                <input onChange={updateFilter} value={filter.filter._search} className="mx-1 form-control" placeholder="Search..."></input>
                <CSVLink className="btn btn-primary mx-1" data={data} filename="form.csv" target="_blank" headers={csvHeaders}>CSV</CSVLink>
                { addButton }
            </div>
            <div style={query.isFetched ? {} : fetchingStyle}>
            { Filters && 
                <div className="d-flex mb-4">
                    <Filters filter={filter}/>
                </div>
            }
            <div className="d-flex mb-4">
                { selectedIds.length>0 
                    ? <>
                    {selectedIds.length} righe selezionate
                    </>
                    : `usa ctrl-click per selezionare una riga` && ''}
            </div>
            <Table className={"model-table" + query.isFetched ? "" : " text-muted"} hover>
                <thead className="thead-dark">
                    <tr>
                        {
                            Object.entries(columns).map(([key, opts]) => 
                                <Th key={key} filter={filter.header(key)} field={fieldsInfo[key]}>{opts.label}</Th>)
                        }
                    </tr>
                </thead>
                <tbody>
                    { data.map(obj => 
                        <tr className={selectedIds.includes(obj._id)?"bg-warning":""} key={obj._id} onClick={evt => handleRowClick(evt, obj)} >
                            {Object.entries(columns).map(([key, opts]) => (
                                <td key={key}>
                                    { opts.render ? opts.render(obj) : displayField(obj, key, fieldsInfo) }
                                </td>
                            ))}
                        </tr>)}
                </tbody>
            </Table>
            </div>
            <p>Visualizzate {data.length}/{query.data.total} righe.</p>
            { query.data.limit < query.data.total
                && <Button ref={scrollRef} onClick={ filter.extendLimit }>
                    {query.isFetched ? "Visualizza altre" : "Caricamento ..."}
                </Button>
            }
        </div>
    </>
}

function displayField(obj, key, fieldsInfo={}) {
    if (key === '*') return JSON.stringify(obj)
    let value = obj[key]
    if (value === undefined) return '???'
    if (value === null) return '---'
    if (key === 'roomAssignment') return `${value.room.code}`
    if (key === 'roomAssignments') return value.map(ra => `${ra.person.lastName}`).join(', ')
    const field = fieldsInfo[key]
    if (field && field.type === 'array') {
        if (!field.items['x-ref']) return value.join(', ')
        if (field.items['x-ref'] === 'Person') {
            return value.map(person => `${person.lastName}`).join(', ')
        } else if (field.items['x-ref'] === 'Institution') {
            if (!value) return '???'
            return value.map(inst => `${inst.name}`).join(' and ')
        } else {
            return `array of ${field.items['x-ref']} not implemented`
        }
    }
    if (field && field.format === 'date-time') return myDateFormat(value)
    const xref = field && field['x-ref'] 
    if (xref === 'Person') {
        return `${value.lastName} ${value.firstName}`
    } else if (xref === 'Room') {
        return `${value.code}`
    } else if (xref === 'ConferenceRoom') {
        return `${value.name}`
    } else if (xref === 'SeminarCategory') {
        return `${value.name}`
    } else if (xref) {
        return `${xref} not implemented`
    }
    if (value === true) return '✓'
    if (value === false) return '✗'
    if (typeof value === 'object') return JSON.stringify(value)
    return value
}

export function Th({ filter, children, field }) {
    const can_sort = field?.can_sort || field?.items?.can_sort
    return <th scope="col" onClick={can_sort?filter.onClick:null} style={can_sort?{cursor: 'pointer'}:{}}>
        {children}{filter.sortIcon}
    </th>
}

export function computeCsvHeaders(fieldsInfo) {
    // console.log(`computeCsvHeaders: ${JSON.stringify(fieldsInfo)}`)
    let headers = []
    for (const [key, field] of Object.entries(fieldsInfo)) {
        if (field['x-ref'] === 'Person') {
            headers.push(`${key}.lastName`)
            headers.push(`${key}.firstName`)
        } else if (field['x-ref'] === 'Institution') {
            headers.push(`${key}.name`)
        } else if (field['x-ref'] === 'SeminarCategory') {
            headers.push(`${key}.name`)
        } else if (field['x-ref'] === 'ConferenceRoom') {
            headers.push(`${key}.name`)
        } else {
            headers.push(key)
        }
    }
    return headers
}