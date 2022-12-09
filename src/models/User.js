import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import Model from './Model'
import { useEngine, useQueryFilter, myDateFormat } from '../Engine'
import { Th } from '../components/Table'

function UsersPage() {
    const filter = useQueryFilter({ _sort: 'createdAt', _limit: 10 })
    const engine = useEngine()
    const query = engine.useIndex('user', filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((user) => navigate(
        `/user/${user._id}`, {replace: true}), [navigate])

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
                    <Th filter={filter.header('updatedAt')}>modificato</Th>
                </tr>
            </thead>
            <tbody>
                { 
                data.map(obj =>
                    <tr key={ obj._id} onClick={()=>navigateTo(obj)}>
                        <td>{ obj.lastName }</td>
                        <td>{ obj.firstName }</td>
                        <td>{ obj.username }</td>
                        <td>{ obj.email }</td>
                        <td>{ obj.roles.join(" ")}</td>
                        <td>{ myDateFormat(obj.updatedAt)}</td>
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

export default class User extends Model {
    static code = 'user'
    static ModelName = 'User'
    static name = "utente"
    static oa = "o"
    
    static describe(obj) { return obj?.username } 

    static Index = UsersPage
}

