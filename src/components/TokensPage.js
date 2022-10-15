import { useState, useEffect } from 'react'
import { Table, Button } from 'react-bootstrap'
import ListInput from './ListInput'

import engine from '../engine'

async function reload(setObjects) {
    try {
        const objs = await engine.getTokens()
        setObjects(objs)
    } catch(err) {
        engine.addErrorMessage(err.message)
    }

} 

export default function TokensPage() {
    const [objects, setObjects ] = useState(null)
    const [token, setToken ] = useState({roles: engine.user().roles})

    console.log(`objects: ${JSON.stringify(objects)}`)
    async function submit() {
        try {
            await engine.putToken(token)
            engine.addInfoMessage(`token aggiunto`)
            reload(setObjects)
        } catch(err) {
            engine.addErrorMessage(err.message)
            return
        }
    }

    useEffect(() => {
        reload(setObjects)
    }, [setObjects])

    if (objects === null) return <span>loading....</span>

    return <>
        <div>
            <Table bordered>
                <thead>
                    <tr>
                        <th>createdBy</th>
                        <th>roles</th>
                        <th>copy</th>
                        <th>delete</th>
                    </tr>
                </thead>
                <tbody>
                    { 
                    objects.map(token =>
                        <tr key={ token._id}>
                            <td>{ token.createdBy.username }</td>
                            <td>{ token.roles.join(" ") }</td>
                            <td><Button onClick={() => {
                                navigator.clipboard.writeText(token.token)
                            }}>{token.token.slice(0,8)}...</Button></td>
                            <td><Button onClick={async () => {
                                try {
                                    await engine.deleteToken(token)
                                    reload(setObjects)
                                } catch(err) {
                                    engine.addErrorMessage(err.message)
                                }
                                }}>remove</Button></td>
                        </tr>) 
                    }
                </tbody>
            </Table>
        </div>
        <Table bordered>
            <tbody>
                <ListInput name="roles" label="ruoli" store={ token } setStore={ setToken } />
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

