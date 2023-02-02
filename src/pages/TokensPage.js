import { useState } from 'react'
import { Table, Button } from 'react-bootstrap'

import { ListInput, StringInput, StringOutput} from '../components/Input'
import { useEngine, myDateFormat } from '../Engine'
import Loading from '../components/Loading'

export default function TokensPage() {
    const engine = useEngine()
    const [obj, setObj ] = useState({roles: engine.user.roles})
    const query = engine.useIndex('token')
    const deleteToken = engine.useDelete('token', (response, token) => engine.addInfoMessage(`token ${token.name} rimosso`))
    const putToken = engine.usePut('token', (token) => engine.addInfoMessage(`token ${token.name} creato`))

    if (query.isLoading) return <Loading />
    if (!query.isSuccess) return null

    const setter = field => value => setObj(obj => ({...obj, [field]: value}))

    const data = query.data.data

    return <>
        <div>
            <Table>
                <thead>
                    <tr>
                        <th>nome</th>
                        <th>ruoli</th>
                        <th>creato</th>
                        <th>copia</th>
                        <th>elimina</th>
                    </tr>
                </thead>
                <tbody>
                    { 
                    data.map(obj =>
                        <tr key={ obj._id}>
                            <td>{ obj.name }</td>
                            <td>{ obj.roles.join(" ") }</td>
                            <td>{ myDateFormat(obj.createdAt)}</td>
                            <td><Button onClick={() => {
                                navigator.clipboard.writeText(obj.token)
                            }}>{obj.token.slice(0,8)}...</Button></td>
                            <td><Button className="btn-danger" onClick={() => deleteToken(obj, `token cancellato`)}>remove</Button></td>
                        </tr>) 
                    }
                </tbody>
            </Table>
        </div>
        <StringInput value={obj.name} setValue={setter("name")} label="nome" />
        <ListInput value={obj.roles} setValue={setter("roles")} label="ruoli" separator=" " />
                <Button onClick={ () => putToken(obj) } className="btn btn-primary">
                    crea token
                </Button>
    </>
}
