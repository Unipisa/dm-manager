import { useState, useEffect } from 'react'
import { Card, Table } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import MyInput from './MyInput'
import ListInput from './ListInput'
import engine from '../engine'

export default function UserPage() {
    const { id } = useParams()
    const create = (id === 'new')
    const [ original, setOriginal ] = useState(null)
    const [ user, setUser ] = useState(original)
    const [ done, setDone ] = useState(false)
    const changed = original===null 
        ? null 
        : Object.entries(user).some(([key, val])=>{
            return val !== original[key]})

    useEffect(() => {(async () => {
        let user = null
        if (create) {
            user = {
                username: "",
                email: "",
                lastName: "",
                firstName: "",
            }
        } else {
            user = await engine.getUser(id)
        }
        setUser(v => ({...v, ...user}))
        setOriginal(v => ({...v, ...user}))
    })()}, [create, id])

    const submit = async (evt) => {
        if (user._id) {
            let payload = Object.fromEntries(Object.entries(user)
                .filter(([key, val]) => (original[key]!==val)))
            try {
                await engine.patchUser(user._id, payload)
                await engine.addInfoMessage("utente modificato")
                setDone(true)
            } catch(err) {
                await engine.addErrorMessage(err.message)
            }
        } else {
            try {
                await engine.putUser(user)
                await engine.addInfoMessage("Nuovo utente inserito")
                setDone(true)
            } catch(err) {
                await engine.addErrorMessage(err.message)
            }
        }
    }

    if (done) return <Navigate to="/users" />

    if (user === null) return <div>loading...</div>

    // console.log(`visit: ${JSON.stringify(visit)}`)

    return <Card>
        <Card.Header>
            <h3>{ create ? `nuovo utente` : `utente ${user.firstName} ${user.lastName}` }</h3>
        </Card.Header>
        <Card.Body>
        <form onSubmit={ (event) => {
            // login(email,password)
            event.preventDefault()
            }}
        >
            <Table border>
                <tbody>
                    <MyInput name="username" label="username" store={ user } setStore={ setUser } />
                    <MyInput name="email" label="email" store={ user } setStore={ setUser } />
                    <MyInput name="firstName" label="nome" store={ user} setStore={ setUser } />
                    <MyInput name="lastName" label="cognome" store={ user } setStore={ setUser } />
                    <ListInput name="roles" label="ruoli" store={ user } setStore={ setUser } />
                </tbody>
                <tfoot>
                    <tr>
                        <td>
                            <input 
                                onClick={ submit } className="btn btn-primary" type="submit" 
                                disabled= { !changed }
                                value={create?"aggiungi utente":"aggiorna utente"} />
                        </td>
                    </tr>
                </tfoot>
            </Table>
            </form>
        </Card.Body>
    </Card>
}
