import { useState } from 'react'
import { Card, ButtonGroup, Button, Form } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import { useEngine } from '../Engine'
import { StringInput, ListInput} from './Input'

export default function UserPage() {
    const engine = useEngine()
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
        <Form onSubmit={ (event) => {
            // login(email,password)
            event.preventDefault()
            }}
        >
            <StringInput name="username" label="username" store={ user } setStore={ setUser } />
            <StringInput name="email" label="email" store={ user } setStore={ setUser } />
            <StringInput name="firstName" label="nome" store={ user} setStore={ setUser } />
            <StringInput name="lastName" label="cognome" store={ user } setStore={ setUser } />
            <ListInput name="roles" label="ruoli" store={ user } setStore={ setUser } separator=" "/>
                <ButtonGroup>
                    <Button 
                        onClick={ submit } 
                        className="btn btn-primary" 
                        disabled= { !changed }>
                        {create?"aggiungi utente":"aggiorna utente"}
                    </Button>
                    <Button 
                        onClick={ () => setRedirect('/users')}
                        className="btn btn-secondary">
                        { changed ? "annulla modifiche" : "torna all'elenco"}
                    </Button>
                    {!create && <Button
                        onClick={ () => deleteUser(user) }
                        className="btn btn-warning pull-right">
                            elimina utente
                    </Button>}
                </ButtonGroup>
            </Form>
        </Card.Body>
    </Card>
}
