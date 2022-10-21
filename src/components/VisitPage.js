import { useState } from 'react'
import { Card, Form, Button, ButtonGroup } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import { useEngine } from '../Engine'
import MyInput from './MyInput'
import DateInput from './DateInput'
import TextInput from './TextInput'

export default function VisitPage() {
    const engine = useEngine()
    const { id } = useParams()
    const create = (id === 'new')
    const empty = {
        lastName: "",
        firstName: "",
        affiliation: "",
        email: "",
        startDate: "",
        endDate: "",
        building: "",
        roomNumber: "",
        invitedBy: "",
        SSD: "",
        notes: "",
    }
    const [ visit, setVisit ] = useState(null)
    const [ redirect, setRedirect ] = useState(null)
    const query = create ? {data: empty, isLoading: false} : engine.useGet('visit', id)
    const putVisit = engine.usePut('visit', (visit) => {
        engine.addInfoMessage(`nuova visita ${visit.lastName} inserita`)
        setRedirect('/visits')
    })
    const patchVisit = engine.usePatch('visit', (response) => {
        engine.addInfoMessage(`visita ${visit.lastName} modificata`)
        setRedirect('/visits')
    })
    const deleteVisit = engine.useDelete('visit', (response, visit) => {
        engine.addWarningMessage(`visita ${visit.lastName} eliminata`)
        setRedirect('/visits')
    })

    if (visit === null) {
        if (!query.isLoading) {
            setVisit(query.data)
        }
        return <div>loading...</div>
    }

    const original = query.data

    const changed = Object.entries(visit).some(([key, val])=>{
            return val !== original[key]})

    const submit = async (evt) => {
        if (visit._id) {
            let payload = Object.fromEntries(Object.entries(visit)
                .filter(([key, val]) => (original[key]!==val)))
            payload._id = visit._id
            patchVisit(payload)
        } else {
            putVisit(visit)
        }
    }

    if (redirect !== null) return <Navigate to={redirect} />

    return <Card>
        <Card.Header>
            <h3>{ create ? `nuovo visitatore` : `visita ${visit?.lastName}` }</h3>
        </Card.Header>
        <Card.Body>
        <Form onSubmit={ (event) => {
            // login(email,password)
            event.preventDefault()
            }}
        >
            <MyInput name="firstName" label="nome" store={ visit } setStore={ setVisit } /> 
            <MyInput name="lastName" label="cognome" store={ visit } setStore={ setVisit } />
            <MyInput name="affiliation" label="affiliazione" store={ visit } setStore={ setVisit } />
            <MyInput name="email" label="email" store={ visit } setStore={ setVisit } />
            <MyInput name="invitedBy" label="referente" store={ visit } setStore={ setVisit } />
            <MyInput name="SSD" label="SSD" store={ visit } setStore= { setVisit } />
            <DateInput name="startDate" label="inizio" store={ visit } setStore={ setVisit } />
            <DateInput name="endDate" label="fine" store={ visit } setStore={ setVisit } />
            <MyInput name="building" label="edificio" store={ visit } setStore={ setVisit } />
            <MyInput name="roomNumber" label="stanza" store={ visit } setStore={ setVisit } />
            <TextInput name="notes" label="note" store={ visit } setStore={ setVisit } />
                <ButtonGroup>
                    <Button 
                        onClick={ submit } 
                        className="btn-primary"
                        disabled= { !changed }>
                        {create?"aggiungi visita":"aggiorna visita"}
                    </Button>
                    <Button 
                        onClick={ () => setRedirect('/visits')}
                        className="btn btn-secondary">
                        { changed ? "annulla modifiche" : "torna all'elenco"}
                    </Button>
                    {!create && <Button
                        onClick={ () => deleteVisit(visit) }
                        className="btn btn-danger pull-right">
                            elimina visita
                    </Button>}
                </ButtonGroup>
            </Form>
        </Card.Body>
    </Card>
}
