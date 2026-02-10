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

const MonthSummary = ({ timesheet, refreshTimesheet }) => {
    const engine = useEngine()
    const [uploadingMonth, setUploadingMonth] = useState(null)
    
    // Calculate total hours per month
    const getMonthHours = (year, month) => {
        // Find the month object
        const monthData = timesheet.months?.find(m => m.year === year && m.month === month)
        
        if (!monthData || !monthData.days) return 0
        
        // Sum hours from all days in this month
        return monthData.days.reduce((total, day) => {
            const grantTotal = day.grantHours?.reduce((sum, gh) => sum + (gh.hours || 0), 0) || 0
            return total + grantTotal + (day.teachingHours || 0) + (day.institutionalHours || 0) + (day.otherHours || 0)
        }, 0)
    }

    const handleToggleLock = async (year, month, locked) => {
        const action = locked ? 'unlock' : 'lock'

        try {
            await api.patch(
                `/api/v0/timesheet/${timesheet._id}/month/${year}/${month}/${action}`
            )

            engine.addInfoMessage(
                `Mese ${month}/${year} ${locked ? 'sbloccato' : 'bloccato'}`
            )

            // ALWAYS refresh after success
            refreshTimesheet()
        } catch (err) {
            engine.addErrorMessage(
                err?.response?.data?.error || 'Operazione fallita'
            )
        }
    }

    const handlePrintMonth = (year, month) => {
        engine.addInfoMessage(`Stampa mese ${month}/${year} (funzionalità da implementare)`)
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
            false     // urlOnly = false → we want the upload id
        )
    }
    
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

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
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <span className="badge bg-success" style={{ cursor: 'pointer' }}>
                                                ✓ Caricato (Apri)
                                            </span>
                                        </a>
                                    ) : (
                                        <span className="badge bg-secondary">- Non caricato</span>
                                    )}
                                </td>
                                <td>
                                    <ButtonGroup size="sm">
                                        <Button
                                            variant={isLocked ? 'warning' : 'success'}
                                            onClick={() =>
                                                handleToggleLock(monthData.year, monthData.month, monthData.locked)
                                            }
                                        >
                                            {isLocked ? 'Sblocca' : 'Blocca'}
                                        </Button>
                                        <Button 
                                            variant="primary" 
                                            size="sm"
                                            onClick={() => handlePrintMonth(monthData.year, monthData.month)}>
                                            Stampa
                                        </Button>
                                        <Button 
                                            variant="info" 
                                            size="sm"
                                            disabled={isUploading}
                                            onClick={() => handleUploadPdf(monthData.year, monthData.month)}>
                                            {isUploading ? 'Caricamento...' : 'Upload PDF'}
                                        </Button>
                                    </ButtonGroup>
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
                <h4>Informazioni Dipendente</h4>
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
                    <strong className="align-top">Tipo Contratto: </strong>
                    {obj.employmentType}
                </p>
                <p>
                    <strong className="align-top">Ruolo: </strong>
                    {obj.role || '---'}
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
                    <strong className="align-top">Grants: </strong>
                    <ModelFieldOutput field="grants" schema={schema.grants} value={obj.grants} />
                </p>

                <MonthSummary timesheet={obj} refreshTimesheet={refreshTimesheet}/>

                <ButtonGroup>
                    <Button key='edit' className="btn-warning" onClick={() => navigate('edit')}>
                        modifica
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

    const refreshTimesheet = () => {
        setRefreshKey(k => k + 1)
    }

    return <>
        <ObjectProvider key={refreshKey} path={Model.code} id={id}>
            <ModelHeading model={Model} />
            <TimesheetView Model={Model} refreshTimesheet={refreshTimesheet} />
        </ObjectProvider>
    </>
}