import { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import engine from '../engine'

export default function UsersPage() {
    const [objects, setObjects ] = useState(null)

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

    return <Container>
        {
            (objects === null) ? <span>loading...</span>: 
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>username</th>
                            <th>email</th>
                            <th>cognome</th>
                            <th>nome</th>    
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        objects.map(user =>
                            <tr key={ user._id}>
                                <td>{ user.username }</td>
                                <td>{ user.email }</td>
                                <td><Link to={`/users/${user._id}`}>{ user.lastName }</Link></td>
                                <td><Link to={`/users/${user._id}`}>{ user.firstName }</Link></td>
                            </tr>) 
                        }
                    </tbody>
                </table>
            </div>
        }
        <Link to="/users/new">aggiungi utente</Link>
    </Container>
}

