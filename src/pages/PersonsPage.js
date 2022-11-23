import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import { useEngine } from '../Engine'
import { useQueryFilter } from '../Engine'
import { Th } from '../components/Table'

export default function PersonsPage() {
    const objCode = 'person'
    const objName = 'persona'
    const objPluralName = 'persone'
    const indexUrl = '/persons'
    const managerRoles = ['admin', 'person-manager']
    const filter = useQueryFilter({'_sort': 'lastName', '_limit': 10})
    const engine = useEngine()
    const query = engine.useIndex(objCode, filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        `${indexUrl}/${obj._id}`, {replace: true}), [navigate])

    if (query.isLoading) return <span>loading...</span>

    const data = query.isSuccess ? query.data.data : []

    return <>
            <div>
                { engine.user.hasSomeRole(...managerRoles) && <Link className="btn btn-primary" to={`${indexUrl}/new`}>
                    aggiungi {objName}</Link> }
                <Table hover>
                    <thead className="thead-dark">
                        <tr>
                            <Th filter={filter.header('lastName')}>cognome</Th>
                            <Th filter={filter.header('firstName')}>nome</Th>
                            <Th filter={filter.header('affiliation')}>affiliazione</Th>
                            <Th filter={filter.header('email')}>email</Th>
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        data.map(obj =>
                            <tr key={obj._id} onClick={()=>navigateTo(obj)}>
                                <td>{ obj.lastName }</td>
                                <td>{ obj.firstName }</td>
                                <td>{ obj.affiliation }</td>
                                <td>{ obj.email }</td>
                            </tr>) 
                        }
                    </tbody>
                </Table>
                <p>Visualizzate {data.length}/{query.data.total} {objPluralName}.</p>
                { query.data.limit < query.data.total
                  && <Button onClick={ filter.extendLimit }>visualizza altre</Button>
                }
            </div>
    </>
}

