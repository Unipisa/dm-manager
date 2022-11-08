import { useState } from 'react'
import { Table, Button } from 'react-bootstrap'
import { ListInput, StringInput } from '../components/Input'

import { useEngine } from '../Engine'

export default function TokensPage() {
    const engine = useEngine()
    const [token, setToken ] = useState({roles: engine.user.roles})
    const query = engine.useIndex('token')
    const deleteToken = engine.useDelete('token', (response, token) => engine.addInfoMessage(`token ${token.name} rimosso`))
    const putToken = engine.usePut('token', (token) => engine.addInfoMessage(`token ${token.name} creato`))

    if (query.isLoading) return <span>loading....</span>

    const data = query.data.data

    return <>
        <div>
            <Table>
                <thead>
                    <tr>
                        <th>nome</th>
                        <th>ruoli</th>
                        <th>copia</th>
                        <th>elimina</th>
                    </tr>
                </thead>
                <tbody>
                    { 
                    data.map(token =>
                        <tr key={ token._id}>
                            <td>{ token.name }</td>
                            <td>{ token.roles.join(" ") }</td>
                            <td><Button onClick={() => {
                                navigator.clipboard.writeText(token.token)
                            }}>{token.token.slice(0,8)}...</Button></td>
                            <td><Button className="btn-danger" onClick={() => deleteToken(token, `token cancellato`)}>remove</Button></td>
                        </tr>) 
                    }
                </tbody>
            </Table>
        </div>
        <StringInput name="name" label="nome" store={token} setStore={ setToken } edit={true}/>
        <ListInput name="roles" label="ruoli" store={ token } setStore={ setToken } separator=" " edit={true}/>
                <Button onClick={ () => putToken(token) } className="btn btn-primary">
                    crea token
                </Button>
    </>
}

