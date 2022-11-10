import { useState } from 'react'
import { Card, Form, Button, ButtonGroup } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { StringInput, DateInput, TextInput } from './Input'

export default function VisitPage() {
    const indexUrl = '/visits'

    const engine = useEngine()
    const { id } = useParams()
    const create = (id === 'new')
    const [ edit, setEdit ] = useState(create)
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
        country: "",
        fundingAgency: "",
    }
    const [ visit, setVisit ] = useState(create ? empty : null)
    const [ redirect, setRedirect ] = useState(null)
    const query = create ? {data: empty, isLoading: false} : engine.useGet('visit', id)
    const putVisit = engine.usePut('visit', (visit) => {
        engine.addInfoMessage(`nuova visita ${visit.lastName} inserita`)
        setRedirect(indexUrl)
    })
    const patchVisit = engine.usePatch('visit', (response) => {
        engine.addInfoMessage(`visita ${visit.lastName} modificata`)
        setRedirect(indexUrl)
    })
    const deleteVisit = engine.useDelete('visit', (response, visit) => {
        engine.addWarningMessage(`visita ${visit.lastName} eliminata`)
        setRedirect(indexUrl)
    })

    if (visit === null) {
        if (query.isSuccess) {
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
        <Form onSubmit={ (event) => event.preventDefault() }
        >
            <StringInput name="firstName" label="nome" store={ visit } setStore={ setVisit } edit={ edit }/> 
            <StringInput name="lastName" label="cognome" store={ visit } setStore={ setVisit } edit={ edit }/>
            <StringInput name="affiliation" label="affiliazione" store={ visit } setStore={ setVisit } edit={ edit }/>
            <StringInput name="country" label="nazione" store={ visit } setStore={ setVisit } edit={ edit }/>
            <StringInput name="email" label="email" store={ visit } setStore={ setVisit } edit={ edit }/>
            <StringInput name="invitedBy" label="referente" store={ visit } setStore={ setVisit } edit={ edit }/>
            <StringInput name="fundingAgency" label="fondo" store={ visit } setStore={ setVisit } edit={ edit }/>
            <StringInput name="SSD" label="SSD" store={ visit } setStore= { setVisit } edit={ edit }/>
            <DateInput name="startDate" label="inizio" store={ visit } setStore={ setVisit } edit={ edit }/>
            <DateInput name="endDate" label="fine" store={ visit } setStore={ setVisit } edit={ edit }/>
            <StringInput name="building" label="edificio" store={ visit } setStore={ setVisit } edit={ edit }/>
            <StringInput name="roomNumber" label="stanza" store={ visit } setStore={ setVisit } edit={ edit }/>
            <TextInput name="notes" label="note" store={ visit } setStore={ setVisit } edit={ edit }/>
            { edit ?
                <ButtonGroup className="mt-3">
                    <Button 
                        onClick={ submit } 
                        className="btn-primary"
                        disabled= { !changed }>
                        {create?"aggiungi visita":"salva modifiche"}
                    </Button>
                    <Button 
                        onClick={ () => setRedirect(indexUrl)}
                        className="btn btn-secondary">
                        { changed ? "annulla modifiche" : "torna all'elenco"}
                    </Button>
                    {!create && <Button
                        onClick={ () => deleteVisit(visit) }
                        className="btn btn-danger pull-right">
                            elimina visita
                    </Button>}
                </ButtonGroup>
            : <ButtonGroup>
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
        <br />
        <p style={{align: "right"}}>
            Creato da <b>{visit.createdBy?.username}</b> 
            {' '}il <b>{myDateFormat(visit.createdAt)}</b>
        <br />
            Modificato da <b>{visit.updatedBy?.username}</b> 
            {' '}il <b>{myDateFormat(visit.updatedAt)}</b>
        </p>
        </Card.Body>
    </Card>
}
