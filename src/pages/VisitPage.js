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
        country: "",
        fundingAgency: "",
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

    const setter = field => value => {
        if (field === 'person') {
            setObj(obj => ({...obj, [field]: value, affiliation: value ? value.affiliation : ""}))
        } else {
            setObj(obj => ({...obj, [field]: value}))
        }
    }

    return <Card>
        <Card.Header>
            <h3>{ create ? `nuova ${objName}` : `${objName} ${obj?.lastName}` }</h3>
        </Card.Header>
        <Card.Body>
        <Form onSubmit={ (event) => event.preventDefault() }>
            <PersonInput value={obj.person} setValue={setter("person")} label="persona" edit={ edit }/>
            <StringInput value={obj.affiliation} setValue={setter("affiliation")} label="affiliazione" edit={ edit }/>
            <StringInput value={obj.country} setValue={setter("country")} label="nazione" edit={ edit }/>
            <PersonInput value={obj.referencePerson} setValue={setter("referencePerson")} label="referente" edit={ edit }/>
            <StringInput value={obj.invitedBy} setValue={setter("invitedBy")} label="altri referenti" edit={ edit }/>
            <StringInput value={obj.fundingAgency} setValue={setter("fundingAgency")} label="fondo" edit={ edit }/>
            <StringInput value={obj.SSD} setValue={setter("SSD")} label="SSD" setStore= { setObj } edit={ edit }/>
            <DateInput value={obj.startDate} setValue={setter("startDate")} label="inizio" edit={ edit }/>
            <DateInput value={obj.endDate} setValue={setter("endDate")} label="fine" edit={ edit }/>
            <StringInput value={obj.building} setValue={setter("building")} label="edificio" edit={ edit }/>
            <StringInput value={obj.roomNumber} setValue={setter("roomNumber")} label="stanza" edit={ edit }/>
            <TextInput value={obj.notes} setValue={setter("notes")} label="note" edit={ edit }/>
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
