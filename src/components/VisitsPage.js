import { useCallback, useState } from 'react'
import { Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { useQueryFilter } from '../Engine'
import { Th } from './Table'

export default function VisitsPage() {
    const filter = useQueryFilter({'_sort': 'startDate', '_limit': 100})
    const engine = useEngine()
    const query = engine.useIndex('visit', filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((visit) => navigate(
        `/visits/${visit._id}`, {replace: true}), [navigate])

    if (query.isLoading) return <span>loading...</span>

    const data = query.isSuccess ? query.data.data : []

    return <>
            <div>
                <Table hover>
                    <thead className="thead-dark">
                        <tr>
                            <Th filter={filter.header('startDate')}>dal</Th>
                            <Th filter={filter.header('endDate')}>al</Th>
                            <Th filter={filter.header('lastName')}>cognome</Th>
                            <Th filter={filter.header('firstName')}>nome</Th>
                            <Th filter={filter.header('invitedBy')}>referente</Th>
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

