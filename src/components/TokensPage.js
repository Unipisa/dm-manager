import { useState, useContext } from 'react'
import { Table, Button } from 'react-bootstrap'
import {useQueryClient, useQuery, useMutation} from 'react-query'
import ListInput from './ListInput'
import MyInput from './MyInput'

import { EngineProvider } from '../Engine'

export default function TokensPage() {
    const [token, setToken ] = useState({roles: engine.user.roles})
    const engine = useContext(EngineProvider)
    const query = useQuery(['token'], () => engine.getObjects("token"))
    const queryClient = useQueryClient()

    const putToken = useMutation((token) => engine.putObject("token", token), {
        onSuccess: () => {
            queryClient.invalidateQueries(['token'])
        }
    }).mutate

    const deleteToken = useMutation((token) => engine.deleteObject("token", token), {
        onSuccess: () => {
            queryClient.invalidateQueries(['token'])
        }
    }).mutate

    async function submit() {
        try {
            await putToken(token)
            engine.addInfoMessage(`token aggiunto`)
        } catch(err) {
            engine.addErrorMessage(err.message)
            return
        }
    }

    if (query.isLoading) return <span>loading....</span>

    return <>
        <div>
            <Table bordered>
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
                    query.data.map(token =>
                        <tr key={ token._id}>
                            <td>{ token.name }</td>
                            <td>{ token.roles.join(" ") }</td>
                            <td><Button onClick={() => {
                                navigator.clipboard.writeText(token.token)
                            }}>{token.token.slice(0,8)}...</Button></td>
                            <td><Button className="btn-danger" onClick={() => deleteToken(token)}>remove</Button></td>
                        </tr>) 
                    }
                </tbody>
            </Table>
        </div>
        <Table bordered>
            <tbody>
                <MyInput name="name" label="nome" store={token} setStore={ setToken }/>
                <ListInput name="roles" label="ruoli" store={ token } setStore={ setToken } separator=" "/>
            </tbody>
            <tfoot>
                <tr>
                    <td>
                        <input 
                            onClick={ submit } className="btn btn-primary" type="submit" 
                            value="nuovo token" />
                    </td>
                </tr>
            </tfoot>
        </Table>
    </>
}

