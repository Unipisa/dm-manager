import { Card } from "react-bootstrap"
import { Button } from "react-bootstrap"
import { useState } from "react"

import { useEngine } from "../Engine"
import Loading from "../components/Loading"
import { ModelFieldInput } from "../components/ModelInput"
import { ModelFieldOutput } from "../components/ModelOutput"

export function FieldOutput({ Model, obj, field, label, editable }) {
    const [edit, setEdit] = useState(false)
    const [value, setValue] = useState(obj[field])
    const engine = useEngine()
    const patchProfile = engine.usePatch(`profile/${Model.code}`)
    const modified = (value !== obj[field])
    const schema = Model.schema.fields
    const field_schema = schema[field]
    label ||= field_schema.items?.label || field_schema.label || field
    
    async function submit() {
        await patchProfile({
                _id: obj._id,
                [field]: value
        })
        setEdit(false)
    }

    function Field() {
        if (edit) return <>
            {modified && <Button onClick={submit}>salva</Button>}
            {edit && <Button className="btn-warning" onClick={() => {
                setEdit(false)
                setValue(obj[field])
            }}>annulla</Button>}
            <ModelFieldInput field={field} schema={field_schema} value={value} setValue={setValue} />
        </>
        else return <>
            <ModelFieldOutput field={field} schema={field_schema} value={obj[field]} />
            {editable && <Button className="btn-warning" onClick={() => setEdit(!edit)}>modifica</Button>}
        </>
    }

    return <p key={field}>
        <strong className="align-top">{label}: </strong>
        <Field />
    </p>
}

const adminEmail = 'help@dm.unipi.it'

const AdminEmail = function () {
    return <a href={`mailto:${adminEmail}`}>{adminEmail}</a>
}

export default function Profile() {
    const engine = useEngine()
    const getProfileUsers = engine.useGet("profile/user")
    const getProfilePeople = engine.useGet("profile/person")
    const getProfileStaffs = engine.useGet("profile/staff")

    if (!getProfileUsers.isSuccess) return <Loading />
    if (!getProfilePeople.isSuccess) return <Loading />
    if (!getProfileStaffs.isSuccess) return <Loading />

    const users = getProfileUsers.data.data
    const user_editable_fields = getProfileUsers.data.editable_fields
    const people = getProfilePeople.data.data
    const person_editable_fields = getProfilePeople.data.editable_fields
    const staffs = getProfileStaffs.data.data
    const staff_editable_fields = getProfileStaffs.data.editable_fields
    const User = engine.Models.User
    const Person = engine.Models.Person
    const Staff = engine.Models.Staff

    return <>
        {users.map(user => <Card key={user._id}>
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
                }).map(([field, label]) => <FieldOutput key={field} label={label} field={field} Model={User} obj={user} editable={user_editable_fields.includes(field)} />)}
            </Card.Body>
            <Card.Footer>
                <p>
                    Nome e Cognome e email sono ottenuti dal sistema di credenziali di ateneo,
                    non possono quindi essere modificati.
                    L'assegnazione dei ruoli è gestita invece dagli amministratori del dipartimento
                    { } <AdminEmail />.
                </p>
            </Card.Footer>
        </Card>)}
        {people.map(person => <Card key={person._id} className="mt-2">
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
                        photoUrl: "Foto"
                    }).map(([field, label]) => 
                    <FieldOutput key={field} label={label} field={field} Model={Person} obj={person} editable={person_editable_fields.includes(field)} />
                )}
                </Card.Body>
                <Card.Footer>
                    <p>
                        Questi dati sono collegati al tuo utente tramite l'indirizzo email.
                        Se ci fossero errori nei dati che non puoi modificare autonomamente
                        puoi scrivere a <AdminEmail />.
                    </p>
                </Card.Footer>
            </Card>)}
        { staffs.map(staff => <Card key={staff._id} className="mt-2">
            <Card.Header>
                <h3>Posizione: {staff.position}</h3>
            </Card.Header>
            <Card.Body>
                {
                    Object.entries({
                        matricola: "Matricola",
                        qualification: "Qualifica",
                        startDate: "Data inizio",
                        endDate: "Data fine",
                        ssd: "SSD",
                        photoUrl: "Foto",
                    }).map(([field, label]) =>
                        <FieldOutput key={field} label={label} field={field} Model={Staff} obj={staff} editable={staff_editable_fields.includes(field)} />
                    )
                }
            </Card.Body>
        </Card>)}
    </>
}