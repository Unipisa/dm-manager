import { useState, useEffect, useCallback, useContext } from 'react'
import { Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import { EngineContext } from '../Engine'

export default function UsersPage() {
    const engine = useContext(EngineContext)
    const [objects, setObjects ] = useState(null)
    const navigate = useNavigate()
    const navigateTo = useCallback((user) => navigate(
        `/users/${user._id}`, {replace: true}), [navigate])

    console.log(`Users Page ${objects}`)

    useEffect(() => {
        (async () => {
            try {
                let objs = await engine.getUsers()
                console.log(`Set objs ${objs}`)
                setObjects(objs)
            } catch(err) {
                engine.addErrorMessage(err.message)
            }
        })()
    }, [setObjects])

    return <>
        {
            (objects === null) ? <span>loading...</span>: 
            <div>
                <Table bordered hover>
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
                        objects.map(user =>
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
        }
        {engine.user().hasSomeRole('admin') && <Link className="btn btn-primary" to="/users/new">aggiungi utente</Link>}
    </>
}

