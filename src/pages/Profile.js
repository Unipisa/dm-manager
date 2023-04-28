import { Card } from "react-bootstrap"

import { useEngine } from "../Engine"
import Loading from "../components/Loading"

function MyField({name, value}) {
    return <p><strong className="align-top">{name}: </strong>
        {value}
    </p>
}

export default function Profile() {
    const engine = useEngine()
    const user = engine.user
    const getProfile = engine.useGet("profile")
    if (!getProfile.isSuccess) return <Loading />
    const profile = getProfile.data
    return <>
    <Card>
        <Card.Header>
            <h3>Il mio utente</h3>
        </Card.Header>
        <Card.Body>
            <MyField name="Nome" value={profile.user.firstName} />
            <MyField name="Cognome" value={profile.user.lastName} />
            <MyField name="Username" value={profile.user.username} />
            <MyField name="Email" value={profile.user.email} />
        </Card.Body>
    </Card>
    {profile.people.map(person => 
        <Card key={person.id}>
            <Card.Header>
                <h3>{person.firstName} {person.lastName}</h3>
            </Card.Header>
            <Card.Body>
                <MyField name="Nome" value={person.firstName} />
                <MyField name="Cognome" value={person.lastName} />
                <MyField name="Email" value={person.email} />
            </Card.Body>
        </Card>
    )}
    </>
}