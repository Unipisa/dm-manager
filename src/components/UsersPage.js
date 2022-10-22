import { useCallback } from 'react'
import { Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import { useEngine } from '../Engine'

export default function UsersPage() {
    const engine = useEngine()
    const query = engine.useIndex('user')
    const navigate = useNavigate()
    const navigateTo = useCallback((user) => navigate(
        `/users/${user._id}`, {replace: true}), [navigate])

    console.log(`Users Page ${query}`)

    if (query.isLoading) return <span>loading...</span>

    const data = query.data.data

    return <>
            <div>
                <Table hover>
                    <thead>
                        <tr>
                            <th>cognome</th>
                            <th>nome</th>    
                            <th>username</th>
                            <th>email</th>
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
            </div>
        {engine.user.hasSomeRole('admin') && <Link className="btn btn-primary" to="/users/new">aggiungi utente</Link>}
    </>
}

