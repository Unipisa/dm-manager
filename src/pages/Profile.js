import { Card } from "react-bootstrap"
import { Button } from "react-bootstrap"
import { useState } from "react"

import { myDateFormat, useEngine } from "../Engine"
import Loading from "../components/Loading"
import { ModelFieldInput } from "../components/ModelInput"
import { ModelFieldOutput } from "../components/ModelOutput"

export function FieldOutput({ Model, obj, field, label, editable }) {
    const [edit, setEdit] = useState(false)
    const [value, setValue] = useState(obj[field])
    const engine = useEngine()
    const patch = engine.usePatch(`profile/${Model.code}`)
    const modified = (value !== obj[field])
    const schema = Model.schema.fields
    const field_schema = schema[field]
    label ||= field_schema.items?.label || field_schema.label || field
    
    async function submit() {
        await patch({
                _id: obj._id,
                [field]: value
        })
        setEdit(false)
    }

    function Field() {
        if (edit) return <>
            {modified && <Button onClick={submit}>salva</Button>}
            <Button className="btn-warning" onClick={() => {
                setEdit(false)
                setValue(obj[field])
            }}>annulla</Button>
            <ModelFieldInput field={field} schema={field_schema} value={value} setValue={setValue} />
        </>
        else return <>
            <ModelFieldOutput field={field} schema={field_schema} value={obj[field]} />
            {editable && <Button className="btn-warning" onClick={() => setEdit(!edit)}>modifica</Button>}
        </>
    }

    return <p key={field}>
        <strong className="align-top">{label}: </strong>
        { Field() }
    </p>
}

const adminEmail = 'help@dm.unipi.it'

const AdminEmail = function () {
    return <a href={`mailto:${adminEmail}`}>{adminEmail}</a>
}

export default function Profile() {
    const engine = useEngine()
    const getUsers = engine.useGet("profile/user")
    const getPeople = engine.useGet("profile/person")
    const getStaffs = engine.useGet("profile/staff")
    const getRoomAssignments = engine.useGet("profile/roomAssignment")
    const getGroups = engine.useGet("profile/group")
    const getVisits = engine.useGet("profile/visit")
    const getGrants = engine.useGet("profile/grant")
    const getTheses = engine.useGet("profile/thesis")

    const User = engine.Models.User
    const Person = engine.Models.Person
    const Staff = engine.Models.Staff

    return <>
        { getUsers.isSuccess 
            ? getUsers.data.data.map(user => <Card key={user._id}>
            <Card.Header>
                <h3>Utente: {user.username}</h3>
            </Card.Header>
            <Card.Body>
                { Object.entries({
                    firstName: "Nome",
                    lastName: "Cognome",
                    username: "Username",
                    email: "Email",
                    roles: "Ruoli"
                }).map(([field, label]) => <FieldOutput key={field} label={label} field={field} Model={User} obj={user} editable={getUsers.data.editable_fields.includes(field)} />)}
            </Card.Body>
            <Card.Footer>
                <p>
                    Nome e Cognome e email sono ottenuti dal sistema di credenziali di ateneo,
                    non possono quindi essere modificati.
                    L'assegnazione dei ruoli è gestita invece dagli amministratori del dipartimento
                    { } <AdminEmail />.
                </p>
            </Card.Footer>
        </Card>)
        : <Loading />}

        {getPeople.isSuccess 
            ? getPeople.data.data.map(person => <Card key={person._id} className="mt-2">
                <Card.Header>
                    <h3>Anagrafica: {person.firstName} {person.lastName}</h3>
                </Card.Header>
                <Card.Body>
                {
                    Object.entries({
                        firstName: "Nome",
                        lastName: "Cognome",
                        email: "Email",
                        gender: "Genere",
                        phone: "Telefono",
                        personalPage: "Url pagina personale",
                        orcid: "Orcid",
                        arxiv_orcid: "Arxiv",
                        google_scholar: "Google-scholar",
                        mathscinet: "Mathscinet",
                        photoUrl: "Foto",
                        about_it: "informazioni opzionali (in italiano) da pubblicare nella propria scheda personale",
                        about_en: "informazioni opzionali (in inglese) da pubblicare nella propria scheda personale",
                    }).map(([field, label]) => 
                    <FieldOutput key={field} label={label} field={field} Model={Person} obj={person} editable={getPeople.data.editable_fields.includes(field)} />
                )}
                </Card.Body>
                <Card.Footer>
                    <p>
                        Questi dati sono collegati al tuo utente tramite l'indirizzo email.
                        Se ci fossero errori nei dati che non puoi modificare autonomamente
                        puoi scrivere a <AdminEmail />.
                    </p>
                </Card.Footer>
            </Card>)
            : <Loading />}

        { getStaffs.isSuccess 
            ? getStaffs.data.data.map(staff => <Card key={staff._id} className="mt-2">
            <Card.Header>
                <h3>Qualifica: {staff.qualification}</h3>
            </Card.Header>
            <Card.Body>
                {
                    Object.entries({
                        matricola: "Matricola",
                        startDate: "Data inizio",
                        endDate: "Data fine",
                        SSD: "SSD",
                        photoUrl: "Foto",
                    }).map(([field, label]) =>
                        <FieldOutput key={field} label={label} field={field} Model={Staff} obj={staff} editable={getStaffs.data.editable_fields.includes(field)} />
                    )
                }
            </Card.Body>
        </Card>)
        : <Loading />}

        {   getRoomAssignments.isSuccess
            ? getRoomAssignments.data.data.length>0 &&
            <Card className="mt-2">
                <Card.Header>
                    <h3>Assegnazioni stanze</h3>
                </Card.Header>
                <Card.Body>
                    <ul>
                        { getRoomAssignments.data.data.map(roomAssignment => 
                        <li key={roomAssignment._id}>
                            <b>stanza {roomAssignment.room.number} edificio {roomAssignment.room.building}</b>:
                            {} dal: {myDateFormat(roomAssignment.startDate)} al: {myDateFormat(roomAssignment.endDate)}
                        </li>
                        )}
                    </ul>
                </Card.Body>
            </Card>
            : <Loading /> }

        { getGroups.isSuccess
            ? (getGroups.data.data.length>0 &&
        <Card className="mt-2">
            <Card.Header>
                <h3>Gruppi e incarichi</h3>
            </Card.Header>
            <Card.Body>
                <ul>
                    {getGroups.data.data.map(group => <li key={group._id}>
                        <b>{group.name}:</b>
                        {} dal: {myDateFormat(group.startDate)} al: {myDateFormat(group.endDate)}
                        </li>
                    )}
                </ul>
            </Card.Body>
        </Card>)
        : <Loading /> }

        {   getVisits.isSuccess 
            ? (getVisits.data.data.length>0 &&
            <Card className="mt-2">
                <Card.Header>
                    <h3>Visitatori</h3>
                </Card.Header>
                <Card.Body>
                    <ul>
                        {getVisits.data.data.map(visit => <li key={visit._id}>
                            <b>{visit.person.lastName} {visit.person.firstName}:</b>
                            {} dal: {myDateFormat(visit.startDate)} al: {myDateFormat(visit.endDate)}
                        </li>
                        )}
                    </ul>
                </Card.Body>
            </Card>)
            : <Loading /> }

        {   getGrants.isSuccess
            ? (getGrants.data.data.length>0 &&
            <Card className="mt-2">
                <Card.Header>
                    <h3>Grants</h3>
                </Card.Header>
                <Card.Body>
                    <ul>
                        {getGrants.data.data.map(grant => <li key={grant._id}>  
                            <b>{grant.name}:</b>
                            {} dal: {myDateFormat(grant.startDate)} al: {myDateFormat(grant.endDate)}
                        </li>
                        )}
                    </ul>
                </Card.Body>
            </Card>)
            : <Loading /> }

        {   getTheses.isSuccess
            ? (getTheses.data.data.length>0 &&
            <Card className="mt-2">
                <Card.Header>
                    <h3>Tesi</h3>
                </Card.Header>
                <Card.Body>
                    <ul>
                        {getTheses.data.data.map(thesis => <li key={thesis._id}>
                            <b>{thesis.person.firstName}, {thesis.person.lastName}:</b>
                            {} <i>{thesis.title}</i> ({myDateFormat(thesis.date)})
                        </li>
                        )}
                    </ul>
                </Card.Body>
            </Card>)
            : <Loading /> }
    </>
}