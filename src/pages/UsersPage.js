import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import { useEngine, useQueryFilter } from '../Engine'
import { Th } from '../components/Table'

export default function UsersPage() {
    const filter = useQueryFilter({ _sort: 'createdAt', _limit: 10 })
    const engine = useEngine()
    const query = engine.useIndex('user', filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((user) => navigate(
        `/users/${user._id}`, {replace: true}), [navigate])

    if (query.isLoading) return <span>loading...</span>
    if (!query.isSuccess) return null
    
    const data = query.data.data
    return  <div>
        {engine.user.hasSomeRole('admin') && <Link className="btn btn-primary" to="/users/new">aggiungi utente</Link>}
        <Table hover>
            <thead>
                <tr>
                    <Th filter={filter.header('lastName')}>cognome</Th>
                    <Th filter={filter.header('firstName')}>nome</Th>    
                    <Th filter={filter.header('username')}>username</Th>
                    <Th filter={filter.header('email')}>email</Th>
                    <th>ruoli</th>
                </tr>
            </thead>
            <tbody>
                { 
                data.map(user =>
                    <tr key={ user._id} onClick={()=>navigateTo(user)}>
                        <td>{ user.lastName }</td>
                        <td>{ user.firstName }</td>
                        <td>{ user.username }</td>
                        <td>{ user.email }</td>
                        <td>{ user.roles.join(" ")}</td>
                    </tr>) 
                }
            </tbody>
        </Table>
        <p>Visualizzati {data.length}/{query.data.total} utenti.</p>
                { query.data.limit < query.data.total
                  && <Button onClick={ filter.extendLimit }>visualizza altri</Button>
                }
    </div>
}

