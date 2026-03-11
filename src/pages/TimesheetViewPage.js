import { useParams, useNavigate } from 'react-router-dom'
import { Button, ButtonGroup, Card, Table } from 'react-bootstrap'
import { useState } from 'react'

import api from '../api'
import { ObjectProvider, useObject } from '../components/ObjectProvider'
import Timestamps from '../components/Timestamps'
import { ModelHeading } from '../components/ModelHeading'
import { ModelFieldOutput } from '../components/ModelOutput'
import { useEngine } from '../Engine'
import { uploadNewAttachment } from '../components/Input'

const YearlySummary = ({ timesheet }) => {
    const grants = timesheet.grants || []
    const roleActivityLabel = timesheet.role === 'research' ? 'Research activities' : 'Administrative activities'

    const yearlyData = {}
    for (const monthData of timesheet.months || []) {
        const { year } = monthData
        if (!yearlyData[year]) {
            yearlyData[year] = { grantHours: {}, roleHours: 0, teachingHours: 0, institutionalHours: 0, otherHours: 0, total: 0 }
        }
        const y = yearlyData[year]
        for (const day of monthData.days || []) {
            for (const gh of day.grantHours || []) {
                y.grantHours[gh.grant] = (y.grantHours[gh.grant] || 0) + (gh.hours || 0)
            }
            y.roleHours += day.roleHours || 0
            y.teachingHours += day.teachingHours || 0
            y.institutionalHours += day.institutionalHours || 0
            y.otherHours += day.otherHours || 0
        }
        y.total = Object.values(y.grantHours).reduce((s, v) => s + v, 0)
            + y.roleHours + y.teachingHours + y.institutionalHours + y.otherHours
    }

    const years = Object.keys(yearlyData).sort()

    const grandTotal = { grantHours: {}, roleHours: 0, teachingHours: 0, institutionalHours: 0, otherHours: 0, total: 0 }
    for (const y of Object.values(yearlyData)) {
        for (const [gid, hrs] of Object.entries(y.grantHours)) {
            grandTotal.grantHours[gid] = (grandTotal.grantHours[gid] || 0) + hrs
        }
        grandTotal.roleHours += y.roleHours
        grandTotal.teachingHours += y.teachingHours
        grandTotal.institutionalHours += y.institutionalHours
        grandTotal.otherHours += y.otherHours
        grandTotal.total += y.total
    }

    if (years.length === 0) return null

    return (
        <div className="my-4" style={{ overflowX: 'auto' }}>
            <h4>
                Riepilogo – Totale ore:{' '}
                <span className="badge bg-primary">{grandTotal.total}h</span>
            </h4>
            <Table bordered hover size="sm">
                <thead className="table-light">
                    <tr>
                        <th>Anno</th>
                        {grants.map((g, idx) => (
                            <th key={idx} title={g.name}>{g.name || `Grant ${idx + 1}`}</th>
                        ))}
                        <th title={roleActivityLabel}>{roleActivityLabel}</th>
                        <th>Teaching activities</th>
                        <th>Institutional activities</th>
                        <th>Other activities</th>
                        <th><strong>Totale</strong></th>
                    </tr>
                </thead>
                <tbody>
                    {years.map(year => {
                        const y = yearlyData[year]
                        return (
                            <tr key={year}>
                                <td><strong>{year}</strong></td>
                                {grants.map((g, idx) => (
                                    <td key={idx}>{y.grantHours[g._id] || 0}h</td>
                                ))}
                                <td>{y.roleHours}h</td>
                                <td>{y.teachingHours}h</td>
                                <td>{y.institutionalHours}h</td>
                                <td>{y.otherHours}h</td>
                                <td><strong>{y.total}h</strong></td>
                            </tr>
                        )
                    })}
                </tbody>
                <tfoot className="table-light">
                    <tr>
                        <td><strong>Totale</strong></td>
                        {grants.map((g, idx) => (
                            <td key={idx}><strong>{grandTotal.grantHours[g._id] || 0}h</strong></td>
                        ))}
                        <td><strong>{grandTotal.roleHours}h</strong></td>
                        <td><strong>{grandTotal.teachingHours}h</strong></td>
                        <td><strong>{grandTotal.institutionalHours}h</strong></td>
                        <td><strong>{grandTotal.otherHours}h</strong></td>
                        <td><strong>{grandTotal.total}h</strong></td>
                    </tr>
                </tfoot>
            </Table>
        </div>
    )
}

const MonthSummary = ({ timesheet, refreshTimesheet }) => {
    const engine = useEngine()
    const [uploadingMonth, setUploadingMonth] = useState(null)
    const navigate = useNavigate()
    
    const getMonthHours = (year, month) => {
        const monthData = timesheet.months?.find(m => m.year === year && m.month === month)
        if (!monthData || !monthData.days) return 0
        return monthData.days.reduce((total, day) => {
            const grantTotal = day.grantHours?.reduce((sum, gh) => sum + (gh.hours || 0), 0) || 0
            return total + grantTotal + (day.roleHours || 0) + (day.teachingHours || 0) + (day.institutionalHours || 0) + (day.otherHours || 0)
        }, 0)
    }

    const handleToggleLock = async (year, month, locked) => {
        const action = locked ? 'unlock' : 'lock'
        try {
            await api.patch(`/api/v0/timesheet/${timesheet._id}/month/${year}/${month}/${action}`)
            engine.addInfoMessage(`Mese ${month}/${year} ${locked ? 'sbloccato' : 'bloccato'}`)
            refreshTimesheet()
        } catch (err) {
            engine.addErrorMessage(err?.response?.data?.error || 'Operazione fallita')
        }
    }

    const handlePrintMonth = (year, month) => {
        window.open(`/api/v0/process/timesheets/${timesheet._id}/${year}/${month}/pdf`, '_blank')
    }

    const handleUploadPdf = async (year, month) => {
        setUploadingMonth(`${year}-${month}`)

        uploadNewAttachment(
            async (uploadId) => {
                try {
                    await api.patch(
                        `/api/v0/timesheet/${timesheet._id}/month/${year}/${month}/upload-pdf`,
                        { signedPdf: uploadId }
                    )

                    engine.addInfoMessage(
                        `PDF firmato caricato per ${month}/${year}`
                    )

                    refreshTimesheet()
                } catch (err) {
                    engine.addErrorMessage(
                        err?.response?.data?.error || 'Errore upload PDF'
                    )
                } finally {
                    setUploadingMonth(null)
                }
            },
            true,     // private
            engine,
            false,     // urlOnly = false → we want the upload id
            false,
            () => setUploadingMonth(null) 
        )
    }

    const handleEditMonth = (year, month) => {
        navigate(`/process/timesheets/${timesheet._id}/${year}/${month}`)
    }

    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 
                        'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

    return (
        <div className="my-4">
            <h4>Riepilogo Mesi</h4>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Mese</th>
                        <th>Ore Totali</th>
                        <th>Stato</th>
                        <th>PDF Firmato</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    {timesheet.months?.map((monthData, idx) => {
                        const totalHours = getMonthHours(monthData.year, monthData.month)
                        const isLocked = monthData.locked
                        const isUploading = uploadingMonth === `${monthData.year}-${monthData.month}`
                        
                        return (
                            <tr key={idx}>
                                <td>{monthNames[monthData.month - 1]} {monthData.year}</td>
                                <td>{totalHours}h</td>
                                <td>
                                    {isLocked 
                                        ? <span className="badge bg-danger">🔒 Bloccato</span>
                                        : <span className="badge bg-success">🔓 Aperto</span>
                                    }
                                </td>
                                <td>
                                    {monthData.signedPdf ? (
                                        <a 
                                            href={`/api/v0/upload/${monthData.signedPdf._id || monthData.signedPdf}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="btn btn-sm btn-success"
                                            style={{ textDecoration: 'none' }}
                                            title="Clicca per scaricare il PDF firmato"
                                        >
                                            ⬇️ Scarica PDF
                                        </a>
                                    ) : (
                                        <span className="badge bg-secondary">Non caricato</span>
                                    )}
                                </td>
                                <td>
                                    <div className="d-flex flex-wrap gap-1">
                                        {/* Edit month - same process as employee */}
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            title="Modifica le ore del mese"
                                            onClick={() => handleEditMonth(monthData.year, monthData.month)}>
                                            ✏️ Modifica
                                        </Button>

                                        {/* Lock/Unlock */}
                                        <Button
                                            variant={isLocked ? 'success' : 'danger'}
                                            size="sm"
                                            title={isLocked ? 'Sblocca il mese' : 'Blocca il mese'}
                                            onClick={() => handleToggleLock(monthData.year, monthData.month, monthData.locked)}>
                                            {isLocked ? '🔓 Sblocca' : '🔒 Blocca'}
                                        </Button>

                                        {/* Print */}
                                        <Button 
                                            variant="secondary"
                                            size="sm"
                                            title="Stampa il timesheet del mese"
                                            onClick={() => handlePrintMonth(monthData.year, monthData.month)}>
                                            🖨️ Stampa
                                        </Button>

                                        {/* Upload PDF */}
                                        <Button 
                                            variant="primary"
                                            size="sm"
                                            disabled={isUploading}
                                            title="Carica il PDF firmato"
                                            onClick={() => handleUploadPdf(monthData.year, monthData.month)}>
                                            {isUploading ? '⏳ Caricamento...' : '📎 Carica PDF'}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </Table>
        </div>
    )
}

const TimesheetView = ({ Model, refreshTimesheet }) => {
    const obj = useObject()
    const navigate = useNavigate()
    const schema = Model.schema.fields

    return (
        <Card>
            <Card.Header>
                <h3>Timesheet {Model.describe(obj)}</h3>
            </Card.Header>
            <Card.Body>
                <p>
                    <strong className="align-top">Dipendente: </strong>
                    <ModelFieldOutput field="employee" schema={schema.employee} value={obj.employee} />
                </p>
                <p>
                    <strong className="align-top">Codice Fiscale: </strong>
                    {obj.fiscalCode || '---'}
                </p>
                <p>
                    <strong className="align-top">Beneficiario: </strong>
                    {obj.beneficiary || '---'}
                </p>
                <p>
                    <strong className="align-top">Direttore: </strong>
                    <ModelFieldOutput field="headOfDepartment" schema={schema.headOfDepartment} value={obj.headOfDepartment} />
                </p>
                <p>
                    <strong className="align-top">Contratto: </strong>
                    {obj.employmentType}
                </p>
                <p>
                    <strong className="align-top">Ruolo: </strong>
                    {obj.role === 'research' ? 'Ricerca' : obj.role === 'administrative' ? 'Amministrativo' : '---'}
                </p>
                <p>
                    <strong className="align-top">Data Inizio: </strong>
                    <ModelFieldOutput field="startDate" schema={schema.startDate} value={obj.startDate} />
                </p>
                <p>
                    <strong className="align-top">Data Fine: </strong>
                    <ModelFieldOutput field="endDate" schema={schema.endDate} value={obj.endDate} />
                </p>
                <p>
                    <strong className="align-top">Grant: </strong>
                    <ModelFieldOutput field="grants" schema={schema.grants} value={obj.grants} />
                </p>

                <YearlySummary timesheet={obj} />
                
                <MonthSummary timesheet={obj} refreshTimesheet={refreshTimesheet} />

                <ButtonGroup>
                    <Button key='edit' className="btn-warning" onClick={() => navigate('edit')}>
                        modifica
                    </Button>
                    <Button key='clone' className="btn-primary" onClick={() => navigate(`${Model.editUrl('__new__')}?clone=${obj._id}`)}>
                        duplica
                    </Button>
                    <Button key='index' className="btn btn-secondary" onClick={() => navigate(-1)}>
                        torna all'elenco
                    </Button>
                </ButtonGroup>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={obj} />
            </Card.Footer>
        </Card>
    )
}

export default function TimesheetViewPage({ Model }) {
    const params = useParams()
    const id = params.id
    const [refreshKey, setRefreshKey] = useState(0)

    const refreshTimesheet = () => setRefreshKey(k => k + 1)

    return <>
        <ObjectProvider key={refreshKey} path={Model.code} id={id}>
            <ModelHeading model={Model} />
            <TimesheetView Model={Model} refreshTimesheet={refreshTimesheet} />
        </ObjectProvider>
    </>
}