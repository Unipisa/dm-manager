import { Card } from "react-bootstrap"

import { useEngine } from "../Engine"
import Loading from "../components/Loading"
import { ModelOutput } from "../components/ModelInput"

function MyField({ name, value }) {
    return <p><strong className="align-top">{name}: </strong>
        {value}
    </p>
}

export function FieldOutput({ Model, obj, field, label }) {
    const schema = Model.schema.fields
    const field_schema = schema[field]
    label ||= field_schema.items?.label || field_schema.label || field
    return <p>
        <strong className="align-top">{label}: </strong>
        <ModelOutput key={field} field={field} schema={field_schema} value={obj[field]} />
    </p>
}

const adminEmail = 'help@dm.unipi.it'

const AdminEmail = function () {
    return <a href={`mailto:${adminEmail}`}>{adminEmail}</a>
}

export default function Profile() {
    const engine = useEngine()
    const getProfile = engine.useGet("profile")
    if (!getProfile.isSuccess) return <Loading />
    const profile = getProfile.data
    const User = engine.Models.User
    const user = profile.user
    const Person = engine.Models.Person
    const Staff = engine.Models.Staff

    return <>
        <Card>
            <Card.Header>
                <h3>Utente: {profile.user.username}</h3>
            </Card.Header>
            <Card.Body>
                <FieldOutput label="Nome" field="firstName" Model={User} obj={user}/>
                <FieldOutput label="Cognome" field="lastName" Model={User} obj={user}/>
                <FieldOutput label="Username" field="username" Model={User} obj={user}/>
                <FieldOutput label="Email" field="email" Model={User} obj={user}/>
                <FieldOutput label="Ruoli" field="roles" Model={User} obj={user}/>
            </Card.Body>
            <Card.Footer>
                <p>
                    Nome e Cognome e email sono ottenuti dal sistema di credenziali di ateneo,
                    non possono quindi essere modificati.
                    L'assegnazione dei ruoli è gestita invece dagli amministratori del dipartimento
                    { } <AdminEmail />.
                </p>
            </Card.Footer>
        </Card>
        {profile.people.map(person => <div key={person._id}>
            <Card className="mt-2">
                <Card.Header>
                    <h3>Anagrafica: {person.firstName} {person.lastName}</h3>
                </Card.Header>
                <Card.Body>
                    <FieldOutput label="Nome" field="firstName" Model={Person} obj={person} />
                    <FieldOutput label="Cognome" field="lastName" Model={Person} obj={person} />
                    <FieldOutput label="Email" field="email" Model={Person} obj={person} />
                    <FieldOutput label="Genere" field="gender" Model={Person} obj={person} />
                    <FieldOutput label="Telefono" field="phone" Model={Person} obj={person} />
                    <FieldOutput label="Url pagina personale" field="personalPage" Model={Person} obj={person} />
                    <FieldOutput label="Orcid" field="orcid" Model={Person} obj={person} />
                    <FieldOutput label="Arxiv" field="arxiv_orcid" Model={Person} obj={person} />
                    <FieldOutput label="Google-scholar" field="google_scholar" Model={Person} obj={person} />
                    <FieldOutput label="Mathscinet" field="mathscinet" Model={Person} obj={person} />
                    <FieldOutput label="Foto" field="photoUrl" Model={Person} obj={person} />
                </Card.Body>
                <Card.Footer>
                    <p>
                        Questi dati sono collegati al tuo utente tramite l'indirizzo email.
                        Se ci fossero errori nei dati che non puoi modificare autonomamente
                        puoi scrivere a <AdminEmail />.
                    </p>
                </Card.Footer>
            </Card>
            { person.staffs.map(staff => <Card key={staff._id} className="mt-2">
                <Card.Header>
                    <h3>Posizione: {staff.position}</h3>
                </Card.Header>
                <Card.Body>
                    <FieldOutput label="Matricola" field="matricola" Model={Staff} obj={staff} />
                    <FieldOutput label="Qualifica" field="qualification" Model={Staff} obj={staff} />
                    <FieldOutput label="Data inizio" field="startDate" Model={Staff} obj={staff} />
                    <FieldOutput label="Data fine" field="endDate" Model={Staff} obj={staff} />
                    <FieldOutput label="SSD" field="ssd" Model={Staff} obj={staff} />
                    <FieldOutput label="Foto" field="photoUrl" Model={Staff} obj={staff} />
                </Card.Body>
            </Card>)}
            </div>
        )}
    </>
}