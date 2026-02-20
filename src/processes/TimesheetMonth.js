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

export default function EditTimesheetMonth() {
    const { timesheetId, year, month } = useParams()
    const navigate = useNavigate()
    const engine = useEngine()
    const queryClient = useQueryClient()
    
    const [modifiedDays, setModifiedDays] = useState(null)
    const [activityDescription, setActivityDescription] = useState('')
    const [hasChanges, setHasChanges] = useState(false)

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

    const isDayInEmploymentPeriod = (dayDate) => {
        const start = new Date(timesheet.startDate)
        const end = new Date(timesheet.endDate)
        return dayDate >= start && dayDate <= end
    }

    // Round to nearest 0.5
    const roundToHalf = (value) => {
        return Math.round(value * 2) / 2
    }

    const updateHours = (dayIndex, field, grantIndex, value) => {
        const newDays = [...modifiedDays]
        let numValue = parseFloat(value)
        if (isNaN(numValue)) numValue = 0
        numValue = roundToHalf(numValue)
        
        if (field === 'grant') {
            if (newDays[dayIndex].grantHours[grantIndex]) {
                newDays[dayIndex].grantHours[grantIndex].hours = numValue
            }
        } else {
            newDays[dayIndex][field] = numValue
        }
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

    // Column totals
    const columnTotals = {
        grantHours: timesheet.grants?.map((_, grantIdx) =>
            modifiedDays.reduce((sum, day) => {
                if (NON_WORKING_TYPES.includes(day.dayType)) return sum
                return sum + (day.grantHours?.[grantIdx]?.hours || 0)
            }, 0)
        ) || [],
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

    return (
        <>
            <h1 className="text-primary pb-0">
                {monthNames[parseInt(month) - 1]} {year}
            </h1>

            <Card className="shadow mt-3 mb-3">
                <Card.Body className="py-2">
                    <p className="mb-1">
                        <strong>📋 Istruzioni:</strong>
                    </p>
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
                            <div className="row">
                                <div className="col-md-6">
                                    <p className="mb-1">
                                        • <strong>{roleActivityLabel}</strong>: {' '}
                                        {timesheet.role === 'research'
                                            ? 'Attività di ricerca istituzionale'
                                            : 'Attività amministrativa ordinaria'
                                        }
                                    </p>
                                    <p className="mb-1">
                                        • <strong>Teaching</strong>: Ore di didattica (frontale e non)
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <p className="mb-1">
                                        • <strong>Institutional</strong>: Consigli, commissioni, ecc.
                                    </p>
                                    <p className="mb-1">
                                        • <strong>Other</strong>: Altre attività non classificate
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Table bordered hover size="sm">
                        <thead className="table-light">
                            <tr>
                                <th style={{ minWidth: '90px' }}>Giorno</th>
                                <th style={{ minWidth: '140px' }}>Tipo</th>
                                {timesheet.grants?.map((grant, idx) => (
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
                            {modifiedDays?.map((day, dayIndex) => {
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
                                                <span className="badge" 
                                                      style={{ 
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

                                        {timesheet.grants?.map((grant, grantIdx) => (
                                            <td key={`day-${dayIndex}-grant-${grantIdx}`}>
                                                {!isNonWorking && !isOutOfPeriod ? (
                                                    <Form.Control
                                                        type="number"
                                                        size="sm"
                                                        min="0"
                                                        max="24"
                                                        step="0.5"
                                                        value={day.grantHours?.[grantIdx]?.hours || 0}
                                                        disabled={isLocked}
                                                        onChange={(e) => updateHours(dayIndex, 'grant', grantIdx, e.target.value)}
                                                    />
                                                ) : null}
                                            </td>
                                        ))}

                                        <td>
                                            {!isNonWorking && !isOutOfPeriod ? (
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    min="0"
                                                    max="24"
                                                    step="0.5"
                                                    value={day.roleHours || 0}
                                                    disabled={isLocked}
                                                    onChange={(e) => updateHours(dayIndex, 'roleHours', null, e.target.value)}
                                                />
                                            ) : null}
                                        </td>

                                        <td>
                                            {!isNonWorking && !isOutOfPeriod ? (
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    min="0"
                                                    max="24"
                                                    step="0.5"
                                                    value={day.teachingHours || 0}
                                                    disabled={isLocked}
                                                    onChange={(e) => updateHours(dayIndex, 'teachingHours', null, e.target.value)}
                                                />
                                            ) : null}
                                        </td>

                                        <td>
                                            {!isNonWorking && !isOutOfPeriod ? (
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    min="0"
                                                    max="24"
                                                    step="0.5"
                                                    value={day.institutionalHours || 0}
                                                    disabled={isLocked}
                                                    onChange={(e) => updateHours(dayIndex, 'institutionalHours', null, e.target.value)}
                                                />
                                            ) : null}
                                        </td>

                                        <td>
                                            {!isNonWorking && !isOutOfPeriod ? (
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    min="0"
                                                    max="24"
                                                    step="0.5"
                                                    value={day.otherHours || 0}
                                                    disabled={isLocked}
                                                    onChange={(e) => updateHours(dayIndex, 'otherHours', null, e.target.value)}
                                                />
                                            ) : null}
                                        </td>

                                        <td>
                                            {dayTotal !== null 
                                                ? <strong>{formatHours(dayTotal)}</strong>
                                                : null
                                            }
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
                            <strong>Breve descrizione delle attività svolte nel mese</strong>
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