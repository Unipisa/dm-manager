import moment from 'moment'
import { useCallback } from 'react'
import { Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import { useEngine } from '../Engine'

function myDateFormat(date) {
    return date ? moment(date).format('D.MM.YYYY') : "---"
}

export default function VisitsPage() {
    const engine = useEngine()
    const query = engine.useIndex('visit')
    const navigate = useNavigate()
    const navigateTo = useCallback((visit) => navigate(
        `/visits/${visit._id}`, {replace: true}), [navigate])

    if (query.isLoading) return <span>loading...</span>
    if (query.isError) engine.addErrorMessage(query.error)

    const data = query.isError? [] : query.data.data

    return <>
            <div>
                <Table bordered hover>
                    <thead>
                        <tr>
                            <th>dal</th>
                            <th>al</th>
                            <th>cognome</th>
                            <th>nome</th>
                            <th>referente</th>
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        data.map(visit =>
                            <tr key={visit._id} onClick={()=>navigateTo(visit)}>
                                <td>{ myDateFormat(visit.startDate) }</td>
                                <td>{ myDateFormat(visit.endDate) }</td>
                                <td>{ visit.lastName }</td>
                                <td>{ visit.firstName }</td>
                                <td>{ visit.invitedBy }</td>
                            </tr>) 
                        }
                    </tbody>
                </Table>
            </div>
        { engine.user.hasSomeRole('admin','visit-manager') && <Link className="btn btn-primary" to="/visits/new">aggiungi visitatore</Link> }
    </>
}

