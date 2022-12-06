import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { useQueryFilter } from '../Engine'
import { Th } from '../components/Table'

export default function RoomAssignmentsPage() {
    const filter = useQueryFilter({'_sort': 'startDate', '_limit': 10})
    const engine = useEngine()
    const query = engine.useIndex('roomAssignment', filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        `/roomAssignments/${obj._id}`, {replace: true}), [navigate])

    if (query.isLoading) return <span>loading...</span>
    if (!query.isSuccess) return null

    const data = query.data.data

    return <>
            <div>
                { engine.user.hasSomeRole('admin','assignment-manager') && <Link className="btn btn-primary" to="/assignments/new">aggiungi assegnazione stanza</Link> }
                <Table hover>
                    <thead className="thead-dark">
                        <tr>
                            <Th filter={filter.header('startDate')}>dal</Th>
                            <Th filter={filter.header('endDate')}>al</Th>
                            <Th filter={filter.header('person')}>persona</Th>
                            <Th filter={filter.header('room')}>stanza</Th>
                            <Th filter={filter.header('updatedAt')}>modificato</Th>
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        data.map(obj =>
                            <tr key={obj._id} onClick={()=>navigateTo(obj)}>
                                <td>{ myDateFormat(obj.startDate) }</td>
                                <td>{ myDateFormat(obj.endDate) }</td>
                                <td>{ `${obj.person ? obj.person.lastName : ""} ${obj.person ? obj.person.firstName : ""}` }</td>
                                <td>{ `${obj.room?.number} ${obj.room?.building} ${obj.room?.floor}`}</td>
                                <td>{ myDateFormat(obj.updatedAt)}</td>
                            </tr>) 
                        }
                    </tbody>
                </Table>
                <p>Visualizzate {data.length}/{query.data.total} stanze.</p>
                { query.data.limit < query.data.total
                  && <Button onClick={ filter.extendLimit }>visualizza altre</Button>
                }
            </div>
    </>
}
