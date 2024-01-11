import { useState } from 'react'
import { Card, Form } from 'react-bootstrap'

import { InputRow, PersonInput, StringInput, EmailInput, InstitutionInput } from '../components/Input'
import { useQuery } from 'react-query'

export default function SelectPersonBlock({ title, label, person, setPerson, active, done, cancel}) {
    const [lastName, setLastName] = useState('')
    const [firstName, setFirstName] = useState('')
    const [email, setEmail] = useState('')
    const [affiliation, setAffiliation] = useState('')

    if (!active) return <Card className="shadow mb-3">
        <Card.Header>
            <div className="d-flex d-row justify-content-between">
                <div>{label}: <strong>{person?.firstName} {person?.lastName}</strong> ({person.affiliations?.map(_ => _.name).join(', ') || '???'})</div>                    
                <div className="btn btn-warning btn-sm" onClick={cancel}>Cambia persona</div>
            </div>
        </Card.Header>
    </Card>

    return <Card className="shadow mb-3">
        <Card.Header className="">{title || "Selezione persona"}</Card.Header>
        <Card.Body>
            <Form className="mb-3">
                <InputRow label="cognome">
                    <StringInput value={lastName} setValue={setLastName} />
                </InputRow>
                <InputRow label="nome">
                    <StringInput value={firstName} setValue={setFirstName} />
                </InputRow>
                <InputRow label="email">
                    <EmailInput value={email} setValue={setEmail} />
                </InputRow>
                <InputRow label="affiliazione">
                    <InstitutionInput value={affiliation} setValue={setAffiliation} />
                </InputRow>
            </Form>
            <PersonSuggestions data={{lastName, firstName, email, affiliation}} />
        </Card.Body>
    </Card>
}

function PersonSuggestions({data}) {
    const { isLoading, error, data: people } = useQuery([...'process/my/visits/person'.split('/'), data])

    if (isLoading) return "Loading"
    if (error) return "Error: " + error.message

    return <>
        {people.map(person => <PersonSuggestion key={person._id} person={person} />)}
    </>
}

function PersonSuggestion({person}) {
    return <Card className="shadow mb-3">
        <Card.Header className="h6">{person.firstName} {person.lastName}</Card.Header>
        <Card.Body>
            <strong>email</strong>: {person.email}<br />
            <strong>affiliazione</strong>: {person.affiliations.map(x => x.name).join(", ")}<br />
        </Card.Body>
    </Card>
}

export function OldSelectPersonBlock({ title, label, person, setPerson, active, done, cancel}) {
    if (active || active===undefined) return <Card className="shadow mb-3">
        <Card.Header className="">{title || "Selezione persona"}</Card.Header>
        <Card.Body>
        <p>
        Digitare le prime lettere del cognome per attivare il completamento. 
        Solo se la persona non esiste, crearne una nuova selezionando 
        la voce che appare nel menù a tendina. 
        In tal caso, inserire nome, cognome e istituzione nella lingua di appartenenza
        (ad esempio, "Universität Zürich" piuttosto che "University of Zurich").
        </p>
        <Form className="mb-3">
            <InputRow label={label || 'persona'}>
                <PersonInput value={person} setValue={(x) => {
                    setPerson(x)
                    done && done()
                }} />
            </InputRow>
        </Form>
        </Card.Body>
    </Card> 
    return <Card className="shadow mb-3">
        <Card.Header>
            <div className="d-flex d-row justify-content-between">
                <div>{label}: <strong>{person?.firstName} {person?.lastName}</strong> ({person.affiliations?.map(_ => _.name).join(', ') || '???'})</div>                    
                <div className="btn btn-warning btn-sm" onClick={cancel}>Cambia persona</div>
            </div>
        </Card.Header>
    </Card>
}
