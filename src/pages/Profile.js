import { Card } from "react-bootstrap"

import { useEngine } from "../Engine"
import Loading from "../components/Loading"

function MyField({name, value}) {
    return <p><strong className="align-top">{name}: </strong>
        {value}
    </p>
}

const adminEmail = 'help@dm.unipi.it'

const AdminEmail = function() {
    return <a href={`mailto:${adminEmail}`}>{adminEmail}</a>
}

export default function Profile() {
    const engine = useEngine()
    const getProfile = engine.useGet("profile")
    if (!getProfile.isSuccess) return <Loading />
    const profile = getProfile.data

    return <>
    <Card>
        <Card.Header>
            <h3>Utente: {profile.user.username}</h3>
        </Card.Header>
        <Card.Body>
            <MyField name="Nome" value={profile.user.firstName} />
            <MyField name="Cognome" value={profile.user.lastName} />
            <MyField name="Username" value={profile.user.username} />
            <MyField name="Email" value={profile.user.email} />
            <MyField name="Ruoli" value={profile.user.roles.join(", ")} />
        </Card.Body>
        <Card.Footer>
            <p>
                Nome e Cognome e email sono ottenuti dal sistema di credenziali di ateneo, 
                non possono quindi essere modificati.
                L'assegnazione dei ruoli è gestita invece dagli amministratori del dipartimento
                {} <AdminEmail />.
            </p>
        </Card.Footer>
    </Card>
    {profile.people.map(person => 
        <Card key={person.id} className="mt-2">
            <Card.Header>
                <h3>Anagrafica: {person.firstName} {person.lastName}</h3>
            </Card.Header>
            <Card.Body>
                <MyField name="Nome" value={person.firstName} />
                <MyField name="Cognome" value={person.lastName} />
                <MyField name="Email" value={person.email} />
            </Card.Body>
            <Card.Footer>
                <p>
                    Questi dati sono collegati al tuo utente tramite l'indirizzo email.
                    Se ci fossero errori nei dati che non puoi modificare autonomamente 
                    puoi scrivere a <AdminEmail />.
                </p>
            </Card.Footer>
</Card>
    )}
    </>
}