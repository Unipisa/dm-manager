import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { useQueryFilter } from '../Engine'
import { Th } from '../components/Table'

export default function VisitsPage() {
    const filter = useQueryFilter({'_sort': '-startDate', '_limit': 10})
    const engine = useEngine()
    const query = engine.useIndex('visit', filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((visit) => navigate(
        `/visits/${visit._id}`, {replace: true}), [navigate])

    if (query.isLoading) return <span>loading...</span>

    const data = query.isSuccess ? query.data.data : []

    return <>
            <div>
                { engine.user.hasSomeRole('admin','visit-manager') && <Link className="btn btn-primary" to="/visits/new">aggiungi visitatore</Link> }
                <Table hover>
                    <thead className="thead-dark">
                        <tr>
                            <Th filter={filter.header('startDate')}>dal</Th>
                            <Th filter={filter.header('endDate')}>al</Th>
                            <Th filter={filter.header('person')}>persona</Th>
                            <Th filter={filter.header('affiliation')}>affiliazione</Th>
                            <Th filter={filter.header('invitedBy')}>referente</Th>
                            <Th filter={filter.header('building')}>edificio</Th>
                            <Th filter={filter.header('roomNumber')}>stanza</Th>
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        data.map(visit =>
                            <tr key={visit._id} onClick={()=>navigateTo(visit)}>
                                <td>{ myDateFormat(visit.startDate) }</td>
                                <td>{ myDateFormat(visit.endDate) }</td>
                                <td>{ `${visit.person ? visit.person.lastName : ""} ${visit.person ? visit.person.firstName : ""}` }</td>
                                <td>{ visit.affiliation }</td>
                                <td>{ visit.referencePerson?.lastName }</td>
                                <td>{ visit.building }</td>
                                <td>{ visit.roomNumber }</td>
                            </tr>) 
                        }
                    </tbody>
                </Table>
                <p>Visualizzate {data.length}/{query.data.total} visite.</p>
                { query.data.limit < query.data.total
                  && <Button onClick={ filter.extendLimit }>visualizza altre</Button>
                }
            </div>
    </>
}

