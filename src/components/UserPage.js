import { useState } from 'react'
import { Card, ButtonGroup, Button, Form } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import { useEngine } from '../Engine'
import { StringInput, ListInput} from './Input'

export default function UserPage() {
    const objCode = 'user'
    const objName = 'utente'
    const indexUrl = '/users'
    const empty = { 
        username: "",
        email: "",
        lastName: "",
        firstName: "",
        roles: []
    }

    const engine = useEngine()
    const { id } = useParams()
    const create = (id === 'new')
    const [ edit, setEdit ] = useState(create)
    const [ obj, setObj ] = useState(create ? empty : null)
    const [ redirect, setRedirect ] = useState(null)
    const query = engine.useGet(objCode, id)
    const putObj = engine.usePut(objCode, (obj) => {
        engine.addInfoMessage(`${objName} ${obj.username} creato`)
        setRedirect(indexUrl)
    })
    const patchObj = engine.usePatch(objCode, (response) => {
        engine.addInfoMessage(`${objName} ${obj.username} modificato`)
        setRedirect(indexUrl)
    })
    const deleteObj = engine.useDelete(objCode, (response, user) => {
        engine.addWarningMessage(`${objName} ${user.username} eliminato`)
        setRedirect(indexUrl)
    })
        
    if (obj === null) {
        if (query.isSuccess) {
            setObj(query.data)
        }        
        return <div>caricamento...</div>
    }

    const original = create ? empty : query.data

    const changed = Object.keys(empty).some(key => obj[key]!==original[key])

    const submit = async (evt) => {
        if (obj._id) {
            let payload = Object.fromEntries(Object.keys(empty))
                .filter(key => obj[key]!==original[key])
                .map(key => ([key, obj[key]]))
            payload._id = obj._id
            patchObj(payload)
        } else {
            putObj(obj)
        }
    }

    if (redirect !== null) return <Navigate to={redirect} />

    return <Card>
        <Card.Header>
            <h3>{ create ? `nuovo ${objName}` : `${objName} ${obj.firstName} ${obj.lastName}` }</h3>
        </Card.Header>
        <Card.Body>
        <Form onSubmit={ (event) => {
            // login(email,password)
            event.preventDefault()
            }}
        >
            <StringInput name="username" label="username" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="email" label="email" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="firstName" label="nome" store={ obj} setStore={ setObj } edit={ edit }/>
            <StringInput name="lastName" label="cognome" store={ obj } setStore={ setObj } edit={ edit }/>
            <ListInput name="roles" label="ruoli" store={ obj } setStore={ setObj } separator=" " edit={ edit }/>
                { edit 
                ?   <ButtonGroup>
                        <Button 
                            onClick={ submit } 
                            className="btn btn-primary" 
                            disabled= { !changed }>
                            {create?`aggiungi ${objName}`: `aggiorna ${objName}`}
                        </Button>
                        <Button 
                            onClick={ () => setRedirect(indexUrl)}
                            className="btn btn-secondary">
                            { changed ? "annulla modifiche" : "torna all'elenco"}
                        </Button>
                        {!create && <Button
                            onClick={ () => deleteObj(obj) }
                            className="btn btn-warning pull-right">
                                {`elimina ${objName}`}
                        </Button>}
                    </ButtonGroup>
                :   <ButtonGroup>
                        <Button 
                            onClick={ () => setEdit(true) }
                            className="btn-warning">
                                modifica
                        </Button>
                        <Button 
                            onClick={ () => setRedirect(indexUrl)}
                            className="btn btn-secondary">
                                torna all'elenco
                        </Button>
                    </ButtonGroup>
                }
            </Form>
        </Card.Body>
    </Card>
}
