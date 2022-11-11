import { useState } from 'react'
import { Card, Form, Button, ButtonGroup } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { StringInput, DateInput, PersonInput, TextInput } from '../components/Input'

export default function VisitPage() {
    const objCode = 'visit'
    const objName = 'visita'
    const indexUrl = '/visits'
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
        person: null,
    }

    const engine = useEngine()
    const { id } = useParams()
    const create = (id === 'new')
    const [ edit, setEdit ] = useState(create)
    const [ obj, setObj ] = useState(create ? empty : null)
    const [ redirect, setRedirect ] = useState(null)
    const query = engine.useGet(objCode, id)
    const putObj = engine.usePut(objCode, (obj) => {
        engine.addInfoMessage(`nuova ${objName} ${obj.lastName} inserita`)
        setRedirect(indexUrl)
    })
    const patchObj = engine.usePatch(objCode, (response) => {
        engine.addInfoMessage(`${objName} ${obj.lastName} modificata`)
        setRedirect(indexUrl)
    })
    const deleteObj = engine.useDelete(objCode, (response, obj) => {
        engine.addWarningMessage(`${objName} ${obj.lastName} eliminata`)
        setRedirect(indexUrl)
    })

    if (obj === null) {
        if (query.isSuccess) {
            setObj(query.data)
        }
        return <div>caricamento...</div>
    }

    const original = create ? empty : query.data

    const changed = Object.entries(obj).some(([key, val])=>{
            return val !== original[key]})

    const submit = async (evt) => {
        if (obj._id) {
            let payload = Object.fromEntries(Object.keys(empty)
                .filter(key => obj[key]!==original[key])
                .map(key => ([key, obj[key]])))
            payload._id = obj._id
            patchObj(payload)
        } else {
            putObj(obj)
        }
    }

    if (redirect !== null) return <Navigate to={redirect} />

    return <Card>
        <Card.Header>
            <h3>{ create ? `nuova ${objName}` : `${objName} ${obj?.lastName}` }</h3>
        </Card.Header>
        <Card.Body>
        <Form onSubmit={ (event) => event.preventDefault() }
        >
            <PersonInput label="Persona" name="person" value={obj.person} setStore={setObj}></PersonInput>
            <StringInput name="firstName" label="nome" store={ obj } setStore={ setObj } edit={ edit }/> 
            <StringInput name="lastName" label="cognome" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="affiliation" label="affiliazione" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="email" label="email" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="invitedBy" label="referente" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="SSD" label="SSD" store={ obj } setStore= { setObj } edit={ edit }/>
            <DateInput name="startDate" label="inizio" store={ obj } setStore={ setObj } edit={ edit }/>
            <DateInput name="endDate" label="fine" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="building" label="edificio" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="roomNumber" label="stanza" store={ obj } setStore={ setObj } edit={ edit }/>
            <TextInput name="notes" label="note" store={ obj } setStore={ setObj } edit={ edit }/>
            { edit ?
                <ButtonGroup className="mt-3">
                    <Button 
                        onClick={ submit } 
                        className="btn-primary"
                        disabled= { !changed }>
                        {create?`aggiungi ${objName}`:`salva modifiche`}
                    </Button>
                    <Button 
                        onClick={ () => setRedirect(indexUrl)}
                        className="btn btn-secondary">
                        { changed ? `annulla modifiche` : `torna all'elenco`}
                    </Button>
                    {!create && <Button
                        onClick={ () => deleteObj(obj) }
                        className="btn btn-danger pull-right">
                            elimina {objName}
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
            Creato da <b>{obj.createdBy?.username}</b> 
            {' '}il <b>{myDateFormat(obj.createdAt)}</b>
        <br />
            Modificato da <b>{obj.updatedBy?.username}</b> 
            {' '}il <b>{myDateFormat(obj.updatedAt)}</b>
        </p>
        </Card.Body>
    </Card>
}
