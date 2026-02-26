import { useQuery } from 'react-query'
import { Card, Table, Button, Badge } from 'react-bootstrap'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

const roleLabel = (role) => {
    if (role === 'research') return 'Ricerca'
    if (role === 'administrative') return 'Amministrativo'
    return '---'
}

const getMonthHours = (monthData) => {
    if (!monthData.days) return { grantHours: {}, roleHours: 0, teachingHours: 0, institutionalHours: 0, otherHours: 0, total: 0 }
    
    const result = { grantHours: {}, roleHours: 0, teachingHours: 0, institutionalHours: 0, otherHours: 0, total: 0 }
    
    for (const day of monthData.days) {
        for (const gh of day.grantHours || []) {
            const id = gh.grant?.toString() || gh.grant
            result.grantHours[id] = (result.grantHours[id] || 0) + (gh.hours || 0)
        }
        result.roleHours += day.roleHours || 0
        result.teachingHours += day.teachingHours || 0
        result.institutionalHours += day.institutionalHours || 0
        result.otherHours += day.otherHours || 0
    }
    
    result.total = Object.values(result.grantHours).reduce((s, h) => s + h, 0)
        + result.roleHours + result.teachingHours + result.institutionalHours + result.otherHours
    
    return result
}

export default function ManageTimesheets() {
    const navigate = useNavigate()
    const { timesheetId } = useParams()

    const { isLoading, error, data } = useQuery(
        ['process', 'timesheets', timesheetId],
        async () => {
            const res = await api.get(
                timesheetId
                    ? `/api/v0/process/timesheets/${timesheetId}`
                    : `/api/v0/process/timesheets`
            )
            return res.data
        }
    )

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>

    const timesheet = data

    if (!timesheet) {
        return (
            <div>
                <h1 className="text-primary pb-0">Il tuo Timesheet</h1>
                <Card className="shadow mt-3">
                    <Card.Body>
                        <p>Non hai ancora un timesheet assegnato.</p>
                        <p>Contatta la segreteria amministrativa per richiedere la creazione del tuo timesheet.</p>
                    </Card.Body>
                </Card>
            </div>
        )
    }

    const handlePrintMonth = (year, month) => {
        window.open(`/api/v0/process/timesheets/${timesheet._id}/${year}/${month}/pdf`, '_blank')
    }

    // Compute yearly summary
    const years = [...new Set(timesheet.months?.map(m => m.year) || [])].sort()
    const grants = timesheet.grants || []

    // yearlyData[year] = { grantHours: {grantId: hours}, roleHours, teachingHours, institutionalHours, otherHours, total }
    const yearlyData = {}
    for (const year of years) {
        yearlyData[year] = { grantHours: {}, roleHours: 0, teachingHours: 0, institutionalHours: 0, otherHours: 0, total: 0 }
    }

    for (const monthData of timesheet.months || []) {
        const mh = getMonthHours(monthData)
        const y = yearlyData[monthData.year]
        for (const [gid, hours] of Object.entries(mh.grantHours)) {
            y.grantHours[gid] = (y.grantHours[gid] || 0) + hours
        }
        y.roleHours += mh.roleHours
        y.teachingHours += mh.teachingHours
        y.institutionalHours += mh.institutionalHours
        y.otherHours += mh.otherHours
        y.total += mh.total
    }

    // Grand totals
    const grandTotal = { grantHours: {}, roleHours: 0, teachingHours: 0, institutionalHours: 0, otherHours: 0, total: 0 }
    for (const y of Object.values(yearlyData)) {
        for (const [gid, hours] of Object.entries(y.grantHours)) {
            grandTotal.grantHours[gid] = (grandTotal.grantHours[gid] || 0) + hours
        }
        grandTotal.roleHours += y.roleHours
        grandTotal.teachingHours += y.teachingHours
        grandTotal.institutionalHours += y.institutionalHours
        grandTotal.otherHours += y.otherHours
        grandTotal.total += y.total
    }

    const roleActivityLabel = timesheet.role === 'research'
        ? 'Institutional research'
        : timesheet.role === 'administrative'
            ? 'Administrative activities'
            : 'Attività istituzionale'

    return (
        <>
            <h1 className="text-primary pb-0">Il tuo Timesheet</h1>

            {/* Informazioni Generali */}
            <Card className="shadow mt-3 mb-4">
                <Card.Header><h5>Informazioni Generali</h5></Card.Header>
                <Card.Body>
                    <p>
                        <strong>Dipendente:</strong>{' '}
                        {timesheet.employee?.firstName} {timesheet.employee?.lastName}
                    </p>
                    <p>
                        <strong>Codice Fiscale:</strong>{' '}
                        {timesheet.fiscalCode || '---'}
                    </p>
                    <p>
                        <strong>Beneficiario:</strong>{' '}
                        {timesheet.beneficiary || '---'}
                    </p>
                    <p>
                        <strong>Periodo:</strong>{' '}
                        {new Date(timesheet.startDate).toLocaleDateString('it-IT')} –{' '}
                        {new Date(timesheet.endDate).toLocaleDateString('it-IT')}
                    </p>
                    <p>
                        <strong>Tipo Contratto:</strong>{' '}
                        {timesheet.employmentType === 'full-time' ? 'Tempo pieno' : 'Part-time'}
                    </p>
                    <p>
                        <strong>Ruolo:</strong>{' '}
                        {roleLabel(timesheet.role)}
                    </p>
                    {grants.length > 0 && (
                        <p>
                            <strong>Grant:</strong>{' '}
                            {grants.map(g => g.name || g.identifier || g._id).join(', ')}
                        </p>
                    )}
                    <hr />
                    <p className="text-muted mb-0" style={{ fontSize: '0.9em' }}>
                        ℹ️ Per richiedere modifiche alle informazioni generali del timesheet, 
                        contattare la <strong>segreteria amministrativa</strong>.
                    </p>
                </Card.Body>
            </Card>

            {/* Riepilogo per Anno */}
            <Card className="shadow mb-4">
                <Card.Header>
                    <h5>
                        Riepilogo – Totale ore:{' '}
                        <Badge bg="primary">{grandTotal.total}h</Badge>
                    </h5>
                </Card.Header>
                <Card.Body>
                    <div style={{ overflowX: 'auto' }}>
                        <Table bordered hover size="sm">
                            <thead className="table-light">
                                <tr>
                                    <th>Anno</th>
                                    {grants.map((g, idx) => (
                                        <th key={idx} title={g.name}>
                                            {g.identifier || g.name || `Grant ${idx + 1}`}
                                        </th>
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
                                                <td key={idx}>
                                                    {y.grantHours[g._id] || 0}h
                                                </td>
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
                                        <td key={idx}>
                                            <strong>{grandTotal.grantHours[g._id] || 0}h</strong>
                                        </td>
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
                    {/* Legenda */}
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
                                        • <strong>Teaching activities</strong>: Ore di didattica (frontale e non)
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <p className="mb-1">
                                        • <strong>Institutional activities</strong>: Consigli, commissioni, ecc.
                                    </p>
                                    <p className="mb-1">
                                        • <strong>Other activities</strong>: Altre attività non classificate
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Riepilogo Mesi */}
            <Card className="shadow mb-4">
                <Card.Header><h5>Riepilogo Mesi</h5></Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive>
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
                                const mh = getMonthHours(monthData)
                                const isLocked = monthData.locked
                                const tsId = timesheetId || timesheet._id

                                return (
                                    <tr key={idx}>
                                        <td>{monthNames[monthData.month - 1]} {monthData.year}</td>
                                        <td>{mh.total}h</td>
                                        <td>
                                            {isLocked
                                                ? <span className="badge bg-danger">🔒 Bloccato</span>
                                                : <span className="badge bg-success">🔓 Aperto</span>
                                            }
                                        </td>
                                        <td>
                                            {monthData.signedPdf
                                                ? 
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
                                                : <span className="badge bg-secondary">Non disponibile</span>
                                            }
                                        </td>
                                        <td>
                                            <div className="d-flex flex-wrap gap-1">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={isLocked}
                                                    title={isLocked ? 'Mese bloccato' : 'Modifica le ore del mese'}
                                                    onClick={() => navigate(`/process/timesheets/${tsId}/${monthData.year}/${monthData.month}`)}>
                                                    ✏️ {isLocked ? 'Bloccato' : 'Modifica'}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    title="Stampa il timesheet del mese"
                                                    onClick={() => handlePrintMonth(monthData.year, monthData.month)}>
                                                    🖨️ Stampa
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </Table>
                    <hr />
                    <p className="text-muted mb-0" style={{ fontSize: '0.9em' }}>
                        ℹ️ Per richiedere lo sblocco di uno o più mesi, 
                        contattare la <strong>segreteria amministrativa</strong>.
                    </p>
                </Card.Body>
            </Card>

            <hr className="mt-4" />
            <div>
                <i>Chi può accedere a questa pagina?</i><br />
                Questa pagina è accessibile a:<br />
                <ul>
                    <li>i dipendenti che hanno un timesheet assegnato, che possono visualizzare e modificare solo il loro timesheet personale;</li>
                    <li>tutti gli utenti con permesso <i>/process/timesheets</i>;</li>
                    <li>gli amministratori.</li>
                </ul>
            </div>
        </>
    )
}