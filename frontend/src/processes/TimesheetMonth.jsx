import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import { Card, Table, Button, Form, Alert } from 'react-bootstrap'
import { useEngine } from '../Engine'
import api from '../api'

const DAY_TYPE_LABELS = {
    'weekday': 'Lavorativo',
    'weekend': 'Weekend',
    'public-holiday': 'Festivo',
    'sick-leave': 'Malattia',
    'annual-holiday': 'Ferie',
    'other-absence': 'Altra assenza',
}

const EMPLOYEE_SELECTABLE_TYPES = ['weekday', 'sick-leave', 'annual-holiday', 'other-absence']
const NON_WORKING_TYPES = ['sick-leave', 'annual-holiday', 'other-absence']

// Build a cell key from dayIndex, field, and an optional grant ID
// For non-grant fields, grantId should be null/undefined → stored as 'none'
// For grant fields, grantId should be the grant._id string
const makeCellKey = (dayIndex, field, grantId) =>
    `${dayIndex}-${field}-${grantId ?? 'none'}`

// Parse a cell key back into its parts
const parseCellKey = (key) => {
    const [dayIdx, field, grantId] = key.split('-')
    return {
        dayIdx: parseInt(dayIdx),
        field,
        grantId: grantId === 'none' ? null : grantId,
    }
}

export default function EditTimesheetMonth() {
    const { timesheetId, year, month } = useParams()
    const navigate = useNavigate()
    const engine = useEngine()
    const queryClient = useQueryClient()

    const [modifiedDays, setModifiedDays] = useState(null)
    const [activityDescription, setActivityDescription] = useState('')
    const [hasChanges, setHasChanges] = useState(false)
    const [selectedCells, setSelectedCells] = useState(new Set())
    const [lastSelectedKey, setLastSelectedKey] = useState(null)

    const apiUrl = `/api/v0/process/timesheets/${timesheetId}/${year}/${month}`

    const { isLoading, error, data } = useQuery(
        ['process', 'timesheets', timesheetId, year, month],
        async () => {
            const res = await api.get(apiUrl)
            return res
        }
    )

    useEffect(() => {
        if (data?.month?.days) {
            setModifiedDays(JSON.parse(JSON.stringify(data.month.days)))
        }
        if (data?.month?.activityDescription !== undefined) {
            setActivityDescription(data.month.activityDescription || '')
        }
    }, [data])

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>
    if (!data || !modifiedDays) return <div>No data found</div>

    const { timesheet, month: monthData } = data
    const isLocked = monthData.locked

    const monthNames = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ]

    const roleActivityLabel = timesheet.role === 'research' ? 'Research' : 'Admin'

    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0)

    const activeGrants = timesheet.grants?.filter(grant => {
        const grantStart = new Date(grant.startDate)
        const grantEnd = new Date(grant.endDate)
        return grantStart <= monthEnd && grantEnd >= monthStart
    }) || []

    const isDayInEmploymentPeriod = (dayDate) => {
        const start = new Date(timesheet.startDate)
        const end = new Date(timesheet.endDate)
        return dayDate >= start && dayDate <= end
    }

    const roundToHalf = (value) => Math.round(value * 2) / 2

    // Apply a numeric value to a single day entry, by field name or grant ID
    const applyValueToDay = (day, field, grantId, numValue) => {
        if (field === 'grant') {
            const entry = day.grantHours.find(gh => gh.grant === grantId)
            if (entry) entry.hours = numValue
        } else {
            day[field] = numValue
        }
    }

    const updateHours = (dayIndex, field, grantId, value) => {
        const newDays = [...modifiedDays]
        let numValue = parseFloat(value)
        if (isNaN(numValue)) numValue = 0
        numValue = roundToHalf(numValue)
        applyValueToDay(newDays[dayIndex], field, grantId, numValue)
        setModifiedDays(newDays)
        setHasChanges(true)
    }

    const updateDayType = (dayIndex, newType) => {
        const newDays = [...modifiedDays]
        newDays[dayIndex].dayType = newType
        if (NON_WORKING_TYPES.includes(newType)) {
            newDays[dayIndex].grantHours = newDays[dayIndex].grantHours.map(gh => ({ ...gh, hours: 0 }))
            newDays[dayIndex].roleHours = 0
            newDays[dayIndex].teachingHours = 0
            newDays[dayIndex].institutionalHours = 0
            newDays[dayIndex].otherHours = 0
        }
        setModifiedDays(newDays)
        setHasChanges(true)
    }

    // All cell keys use grant._id (or 'none') — never a positional index
    const handleCellClick = (dayIndex, field, grantId, event) => {
        const cellKey = makeCellKey(dayIndex, field, grantId)

        if (event.ctrlKey || event.metaKey) {
            const newSelected = new Set(selectedCells)
            if (newSelected.has(cellKey)) {
                newSelected.delete(cellKey)
            } else {
                newSelected.add(cellKey)
            }
            setSelectedCells(newSelected)
            setLastSelectedKey(cellKey)
        } else if (event.shiftKey && lastSelectedKey) {
            const newSelected = new Set(selectedCells)
            const { dayIdx: lastDay, field: lastField, grantId: lastGrantId } = parseCellKey(lastSelectedKey)
            // Only range-select within the same column (same field + same grantId)
            if (field === lastField && grantId === lastGrantId) {
                const startDay = Math.min(lastDay, dayIndex)
                const endDay = Math.max(lastDay, dayIndex)
                for (let i = startDay; i <= endDay; i++) {
                    newSelected.add(makeCellKey(i, field, grantId))
                }
            }
            setSelectedCells(newSelected)
        } else {
            setSelectedCells(new Set([cellKey]))
            setLastSelectedKey(cellKey)
        }
    }

    const handleKeyDown = (event, dayIndex, field, grantId) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            const nextRow = dayIndex + 1
            if (nextRow < modifiedDays.length) {
                const nextInput = document.querySelector(
                    `input[data-cell="${makeCellKey(nextRow, field, grantId)}"]`
                )
                if (nextInput) nextInput.focus()
            }
        }
    }

    const updateMultipleCells = (dayIndex, field, grantId, value) => {
        const cellKey = makeCellKey(dayIndex, field, grantId)

        if (selectedCells.size > 1 && selectedCells.has(cellKey)) {
            const newDays = [...modifiedDays]
            let numValue = parseFloat(value)
            if (isNaN(numValue)) numValue = 0
            numValue = roundToHalf(numValue)

            selectedCells.forEach(key => {
                const { dayIdx, field: f, grantId: gId } = parseCellKey(key)
                applyValueToDay(newDays[dayIdx], f, gId, numValue)
            })

            setModifiedDays(newDays)
            setHasChanges(true)
        } else {
            updateHours(dayIndex, field, grantId, value)
        }
    }

    const handleSave = async () => {
        try {
            await api.patch(apiUrl, {
                days: modifiedDays,
                activityDescription,
            })
            engine.addInfoMessage('Ore salvate con successo')
            queryClient.invalidateQueries(['process', 'timesheets'])
            setHasChanges(false)
            navigate(-1)
        } catch (error) {
            engine.addErrorMessage(`Errore nel salvataggio: ${error.message}`)
        }
    }

    const handleCancel = () => navigate(-1)

    const getDayTotal = (day) => {
        if (NON_WORKING_TYPES.includes(day.dayType)) return null
        const grantTotal = day.grantHours?.reduce((sum, gh) => sum + (gh.hours || 0), 0) || 0
        return grantTotal + (day.roleHours || 0) + (day.teachingHours || 0)
            + (day.institutionalHours || 0) + (day.otherHours || 0)
    }

    const columnTotals = {
        grantHours: activeGrants.map(grant =>
            modifiedDays.reduce((sum, day) => {
                if (NON_WORKING_TYPES.includes(day.dayType)) return sum
                const gh = day.grantHours?.find(g => g.grant === grant._id)
                return sum + (gh?.hours || 0)
            }, 0)
        ),
        roleHours: modifiedDays.reduce((sum, day) => {
            if (NON_WORKING_TYPES.includes(day.dayType)) return sum
            return sum + (day.roleHours || 0)
        }, 0),
        teachingHours: modifiedDays.reduce((sum, day) => {
            if (NON_WORKING_TYPES.includes(day.dayType)) return sum
            return sum + (day.teachingHours || 0)
        }, 0),
        institutionalHours: modifiedDays.reduce((sum, day) => {
            if (NON_WORKING_TYPES.includes(day.dayType)) return sum
            return sum + (day.institutionalHours || 0)
        }, 0),
        otherHours: modifiedDays.reduce((sum, day) => {
            if (NON_WORKING_TYPES.includes(day.dayType)) return sum
            return sum + (day.otherHours || 0)
        }, 0),
    }

    const grandTotal = columnTotals.grantHours.reduce((s, h) => s + h, 0)
        + columnTotals.roleHours + columnTotals.teachingHours
        + columnTotals.institutionalHours + columnTotals.otherHours

    const dayOfWeekLabels = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    const formatHours = (hours) => hours.toFixed(1).replace('.', ',')

    // Shared props factory to avoid repetition for non-grant fields
    const makeFieldInputProps = (dayIndex, field, value) => ({
        type: 'number',
        size: 'sm',
        min: '0',
        max: '24',
        step: '0.5',
        value,
        disabled: isLocked,
        onFocus: (e) => e.target.select(),
        'data-cell': makeCellKey(dayIndex, field, null),
        onClick: (e) => handleCellClick(dayIndex, field, null, e),
        onKeyDown: (e) => handleKeyDown(e, dayIndex, field, null),
        onInput: (e) => updateMultipleCells(dayIndex, field, null, e.target.value),
        onWheel: (e) => e.target.blur(),
        style: {
            backgroundColor: selectedCells.has(makeCellKey(dayIndex, field, null)) ? '#e3f2fd' : 'white'
        }
    })

    return (
        <>
            <h1 className="text-primary pb-0">
                {monthNames[parseInt(month) - 1]} {year}
            </h1>

            <Card className="shadow mt-3 mb-3">
                <Card.Body className="py-2">
                    <p className="mb-1"><strong>📋 Istruzioni:</strong></p>
                    <ul className="mb-0" style={{ fontSize: '0.9em' }}>
                        <li>Inserire le ore lavorate per ogni giorno del mese nelle colonne appropriate</li>
                        <li>Le ore vengono automaticamente arrotondate a incrementi di 0,5 (es. 3,8 diventa 4,0)</li>
                        <li>Usare il menu "Tipo" per segnare giorni di malattia, ferie o altre assenze</li>
                        <li>Weekend e festività sono già contrassegnati e non possono essere modificati</li>
                        <li>(Opzionale) Completare la descrizione delle attività prima di salvare</li>
                    </ul>
                </Card.Body>
            </Card>

            {isLocked && (
                <Alert variant="warning" className="mt-3">
                    <strong>⚠️ Questo mese è bloccato</strong> - Non puoi modificare le ore.
                </Alert>
            )}

            <Card className="shadow mb-4">
                <Card.Header>
                    <h5>Dipendente: {timesheet.employee?.firstName} {timesheet.employee?.lastName}</h5>
                </Card.Header>
                <Card.Body>
                    {/* Legend */}
                    <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <p className="mb-2"><strong>Legenda colonne:</strong></p>
                        <div style={{ fontSize: '0.85em' }}>
                            {activeGrants.length > 0 && (
                                <div className="mb-2">
                                    <p className="mb-1"><strong>Grants:</strong></p>
                                    {activeGrants.map((grant, idx) => (
                                        <p key={idx} className="mb-1 ms-3">
                                            • {grant.identifier
                                                ? <><strong>{grant.identifier}</strong>: {grant.name}</>
                                                : grant.name
                                            }
                                        </p>
                                    ))}
                                </div>
                            )}
                            <div className="row">
                                <div className="col-md-6">
                                    <p className="mb-1">
                                        • <strong>{roleActivityLabel}</strong>:{' '}
                                        {timesheet.role === 'research'
                                            ? 'Attività di ricerca istituzionale'
                                            : 'Attività amministrativa ordinaria'
                                        }
                                    </p>
                                    <p className="mb-1">• <strong>Teaching</strong>: Ore di didattica (frontale e non)</p>
                                </div>
                                <div className="col-md-6">
                                    <p className="mb-1">• <strong>Institutional</strong>: Consigli, commissioni, ecc.</p>
                                    <p className="mb-1">• <strong>Other</strong>: Altre attività non classificate</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Table bordered hover size="sm">
                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                <th style={{ minWidth: '90px' }}>Giorno</th>
                                <th style={{ minWidth: '140px' }}>Tipo</th>
                                {activeGrants.map((grant, idx) => (
                                    <th key={`grant-${idx}`} style={{ minWidth: '80px' }}>
                                        {grant.identifier || grant.name || `Grant ${idx + 1}`}
                                    </th>
                                ))}
                                <th style={{ minWidth: '80px' }}>{roleActivityLabel}</th>
                                <th style={{ minWidth: '80px' }}>Teaching</th>
                                <th style={{ minWidth: '80px' }}>Institutional</th>
                                <th style={{ minWidth: '80px' }}>Other</th>
                                <th style={{ minWidth: '70px' }}>Totale</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modifiedDays.map((day, dayIndex) => {
                                const dayDate = new Date(day.date)
                                const dayOfWeek = dayOfWeekLabels[dayDate.getDay()]
                                const isNonWorking = NON_WORKING_TYPES.includes(day.dayType)
                                const isFixed = day.dayType === 'weekend' || day.dayType === 'public-holiday'
                                const isOutOfPeriod = !isDayInEmploymentPeriod(dayDate)
                                const dayTotal = getDayTotal(day)
                                const rowClass = isNonWorking || isOutOfPeriod ? 'table-secondary' : ''

                                return (
                                    <tr key={dayIndex} className={rowClass}>
                                        <td>
                                            <strong>{day.day}</strong>{' '}
                                            <span className="text-muted">{dayOfWeek}</span>
                                        </td>

                                        <td>
                                            {isFixed || isOutOfPeriod ? (
                                                <span className="badge" style={{
                                                    backgroundColor: day.dayType === 'public-holiday' ? '#ffc107' : '#6c757d',
                                                    color: day.dayType === 'public-holiday' ? '#000' : '#fff'
                                                }}>
                                                    {DAY_TYPE_LABELS[day.dayType]}
                                                </span>
                                            ) : (
                                                <Form.Select
                                                    size="sm"
                                                    value={day.dayType}
                                                    disabled={isLocked}
                                                    onChange={(e) => updateDayType(dayIndex, e.target.value)}
                                                    style={{ fontSize: '0.8em' }}
                                                >
                                                    {EMPLOYEE_SELECTABLE_TYPES.map(type => (
                                                        <option key={type} value={type}>
                                                            {DAY_TYPE_LABELS[type]}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            )}
                                        </td>

                                        {activeGrants.map((grant) => {
                                            const grantStart = new Date(grant.startDate)
                                            const grantEnd = new Date(grant.endDate)
                                            const isGrantActive = dayDate >= grantStart && dayDate <= grantEnd
                                            const cellKey = makeCellKey(dayIndex, 'grant', grant._id)
                                            const grantHours = day.grantHours?.find(gh => gh.grant === grant._id)?.hours || 0

                                            return (
                                                <td key={`day-${dayIndex}-grant-${grant._id}`}>
                                                    {!isNonWorking && !isOutOfPeriod && isGrantActive ? (
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            min="0"
                                                            max="24"
                                                            step="0.5"
                                                            value={grantHours}
                                                            disabled={isLocked}
                                                            onFocus={(e) => e.target.select()}
                                                            data-cell={cellKey}
                                                            onClick={(e) => handleCellClick(dayIndex, 'grant', grant._id, e)}
                                                            onKeyDown={(e) => handleKeyDown(e, dayIndex, 'grant', grant._id)}
                                                            onInput={(e) => updateMultipleCells(dayIndex, 'grant', grant._id, e.target.value)}
                                                            onWheel={(e) => e.target.blur()}
                                                            style={{
                                                                backgroundColor: selectedCells.has(cellKey) ? '#e3f2fd' : 'white'
                                                            }}
                                                        />
                                                    ) : null}
                                                </td>
                                            )
                                        })}

                                        <td>
                                            {!isNonWorking && !isOutOfPeriod
                                                ? <Form.Control {...makeFieldInputProps(dayIndex, 'roleHours', day.roleHours || 0)} />
                                                : null}
                                        </td>
                                        <td>
                                            {!isNonWorking && !isOutOfPeriod
                                                ? <Form.Control {...makeFieldInputProps(dayIndex, 'teachingHours', day.teachingHours || 0)} />
                                                : null}
                                        </td>
                                        <td>
                                            {!isNonWorking && !isOutOfPeriod
                                                ? <Form.Control {...makeFieldInputProps(dayIndex, 'institutionalHours', day.institutionalHours || 0)} />
                                                : null}
                                        </td>
                                        <td>
                                            {!isNonWorking && !isOutOfPeriod
                                                ? <Form.Control {...makeFieldInputProps(dayIndex, 'otherHours', day.otherHours || 0)} />
                                                : null}
                                        </td>

                                        <td>
                                            {dayTotal !== null
                                                ? <strong>{formatHours(dayTotal)}</strong>
                                                : null}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot className="table-light">
                            <tr>
                                <td colSpan={2}><strong>Totale</strong></td>
                                {columnTotals.grantHours.map((h, idx) => (
                                    <td key={idx}><strong>{formatHours(h)}</strong></td>
                                ))}
                                <td><strong>{formatHours(columnTotals.roleHours)}</strong></td>
                                <td><strong>{formatHours(columnTotals.teachingHours)}</strong></td>
                                <td><strong>{formatHours(columnTotals.institutionalHours)}</strong></td>
                                <td><strong>{formatHours(columnTotals.otherHours)}</strong></td>
                                <td><strong>{formatHours(grandTotal)}</strong></td>
                            </tr>
                        </tfoot>
                    </Table>

                    <Form.Group className="mt-4">
                        <Form.Label>
                            <strong>(Opzionale) Breve descrizione delle attività svolte nel mese</strong>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={activityDescription}
                            disabled={isLocked}
                            placeholder="Inserire una breve descrizione delle attività svolte nel mese..."
                            onChange={(e) => {
                                setActivityDescription(e.target.value)
                                setHasChanges(true)
                            }}
                        />
                    </Form.Group>

                    <div className="mt-4 d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={handleCancel}>
                            Annulla
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!hasChanges || isLocked}
                            onClick={handleSave}>
                            Salva Modifiche
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </>
    )
}