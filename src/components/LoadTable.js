import { useCallback, useRef, useState } from 'react'
import { Table, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import { useEngine, myDateFormat, useQueryFilter } from '../Engine'
import Loading from './Loading'

// ------------------------------------------------------------
// CSV helpers
// ------------------------------------------------------------
 
/**
 * Recursively flattens a nested object into dot-notation keys.
 * Example: { person: { firstName: 'A', lastName: 'B' } }
 *       => { 'person.firstName': 'A', 'person.lastName': 'B' }
 *
 * Arrays of primitives are joined with ', '.
 * Arrays of objects are flattened with index suffix: speakers.0.lastName, etc.
 */
function flattenObject(obj, prefix = '', result = {}) {
    if (obj === null || obj === undefined) {
        result[prefix] = ''
        return result
    }
    if (typeof obj !== 'object') {
        result[prefix] = obj
        return result
    }
    if (Array.isArray(obj)) {
        if (obj.length === 0) {
            result[prefix] = ''
        } else if (typeof obj[0] !== 'object') {
            // primitive array → join
            result[prefix] = obj.join(', ')
        } else {
            // object array → flatten each element with index
            obj.forEach((item, i) => {
                flattenObject(item, prefix ? `${prefix}.${i}` : String(i), result)
            })
        }
        return result
    }
    // plain object
    for (const [key, val] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        flattenObject(val, newKey, result)
    }
    return result
}
 
/**
 * Given an array of raw mongo documents, returns:
 *   { headers: [{label, key}, ...], rows: [{...}, ...] }
 *
 * If `csvHeaders` is provided (array of key strings), only those columns
 * are included (in that order); otherwise all flattened keys are used.
 *
 * Internal mongo/system fields are always stripped.
 */
const STRIP_KEYS = new Set(['__v', 'createdBy', 'updatedBy'])
const STRIP_PREFIX = ['_'] // strip keys starting with _ except explicit overrides
 
function buildCsvData(data, csvHeaders) {
    if (!data || data.length === 0) return { headers: [], rows: [] }
 
    // Flatten all rows
    const flatRows = data.map(obj => flattenObject(obj))
 
    let keys
    if (csvHeaders && csvHeaders.length > 0) {
        keys = csvHeaders
    } else {
        // Collect all keys from all rows, preserving insertion order
        const keySet = new Set()
        for (const row of flatRows) {
            for (const k of Object.keys(row)) {
                if (STRIP_KEYS.has(k)) continue
                if (STRIP_PREFIX.some(p => k.startsWith(p))) continue
                keySet.add(k)
            }
        }
        keys = [...keySet]
    }
 
    const headers = keys.map(k => ({ label: k, key: k }))
    const rows = flatRows.map(flat => {
        const row = {}
        for (const k of keys) {
            const val = flat[k]
            // format dates
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
                row[k] = myDateFormat(val)
            } else if (val === null || val === undefined) {
                row[k] = ''
            } else {
                row[k] = val
            }
        }
        return row
    })
 
    return { headers, rows }
}
 
/**
 * Convert array-of-objects to CSV string and trigger browser download.
 */
function downloadCsv(headers, rows, filename = 'export.csv') {
    const escape = val => {
        const s = String(val ?? '')
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`
        }
        return s
    }
    const headerLine = headers.map(h => escape(h.label)).join(',')
    const bodyLines = rows.map(row => headers.map(h => escape(row[h.key])).join(','))
    const csv = [headerLine, ...bodyLines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export default function LoadTable({path, defaultFilter, viewUrl, fieldsInfo, addButton, columns, csvHeaders, Filters}) {    
    const engine = useEngine()
    const filter = useQueryFilter(defaultFilter || {})
    const query = engine.useIndex(path, filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        viewUrl(obj), {replace: false, state: { fromApp: true } }), [navigate, viewUrl])
    const scrollRef = useRef(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [csvLoading, setCsvLoading] = useState(false)
 
    columns ||= []
    if (Array.isArray(columns)) {
        columns = Object.fromEntries(columns.map(key => [key, key]))
    }
    columns = Object.fromEntries(Object.entries(columns).map((
        [key, label]) => (typeof label === 'string')
        ? [key, { label }]
        : [key, label]))
 
    // ----------------------------------------------------------
    // CSV export: fetch ALL data from the full queryPipeline
    // (not the indexPipeline), then flatten and download.
    // ----------------------------------------------------------
    async function handleCsvExport() {
        setCsvLoading(true)
        try {
            // Build query params: same active filters but no limit,
            // and no _sort (server default). We send _limit=0 to get all records.
            const exportFilter = { ...filter.filter, _limit: 0, _full: 1 }
            // Remove pagination-only keys that aren't filters
            delete exportFilter._sort
 
            const data = await engine.api.get(`/api/v0/${path}`, exportFilter)
            const allRows = data?.data ?? []
 
            const { headers, rows } = buildCsvData(allRows, csvHeaders)
 
            // derive a nice filename from the path
            const filename = path.replace(/\//g, '_') + '.csv'
            downloadCsv(headers, rows, filename)
        } catch (err) {
            engine.addErrorMessage(`Errore esportazione CSV: ${err.message}`)
        } finally {
            setCsvLoading(false)
        }
    }

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
                <button
                    className="btn btn-primary mx-1"
                    onClick={handleCsvExport}
                    disabled={csvLoading}
                >
                    {csvLoading ? 'Esportazione…' : 'CSV'}
                </button>
                {addButton}
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
        } else if (field.items['x-ref'] === 'SeminarCategory') {
            if (!value) return '???'
            return value.map(cat => `${cat.name}`).join(', ')
        } else if (field.items['x-ref'] === 'Grant') {
            if (!value) return '???'
            return value.map(grant => `${grant.name}`).join(' and ')    
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