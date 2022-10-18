import { useState, useContext } from 'react'
import { Card, Table } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import { EngineContext } from '../Engine'
import MyInput from './MyInput'
import ListInput from './ListInput'

export default function UserPage() {
    const engine = useContext(EngineContext)
    const { id } = useParams()
    const create = (id === 'new')
    const empty = { 
        username: "",
        email: "",
        lastName: "",
        firstName: "",
        roles: []
    }
    const [ user, setUser ] = useState(null)
    const [ redirect, setRedirect ] = useState(null)
    const query = create ? {data: empty, isLoading: false} : engine.useGet('user', id)
    const putUser = engine.usePut('user', (user) => {
        engine.addInfoMessage(`utente ${user.username} creato`)
        setRedirect('/users')
    })
    const patchUser = engine.usePatch('user', (response) => {
        engine.addInfoMessage(`utente ${user.username} modificato`)
        setRedirect('/users')
    })
    const deleteUser = engine.useDelete('user', (response, user) => {
        engine.addWarningMessage(`utente ${user.username} eliminato`)
        setRedirect('/users')
    })
        
    if (user === null) {
        if (!query.isLoading) {
            setUser(query.data)
        }        
        return <div>loading...</div>
    }

    const original = query.data

    const changed = Object.entries(user).some(([key, val])=>{
            return val !== original[key]})

    const submit = async (evt) => {
        if (user._id) {
            let payload = Object.fromEntries(Object.entries(user)
                .filter(([key, val]) => (original[key]!==val)))
            payload._id = user._id
            patchUser(payload)
        } else {
            putUser(user)
        }
    }

    if (redirect !== null) return <Navigate to={redirect} />

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
            <Table bordered>
                <tbody>
                    <MyInput name="username" label="username" store={ user } setStore={ setUser } />
                    <MyInput name="email" label="email" store={ user } setStore={ setUser } />
                    <MyInput name="firstName" label="nome" store={ user} setStore={ setUser } />
                    <MyInput name="lastName" label="cognome" store={ user } setStore={ setUser } />
                    <ListInput name="roles" label="ruoli" store={ user } setStore={ setUser } separator=" "/>
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="2">
                            <button 
                                onClick={ submit } 
                                className="btn btn-primary" 
                                disabled= { !changed }>
                                {create?"aggiungi utente":"aggiorna utente"}
                            </button>
                            <button 
                                onClick={ () => setRedirect('/users')}
                                className="btn btn-secondary">
                                { changed ? "annulla modifiche" : "torna all'elenco"}
                            </button>
                            {!create && <button
                                onClick={ () => deleteUser(user) }
                                className="btn btn-warning pull-right">
                                    elimina utente
                            </button>}
                        </td>
                    </tr>
                </tfoot>
            </Table>
            </form>
        </Card.Body>
    </Card>
}
