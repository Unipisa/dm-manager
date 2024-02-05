import { useState } from 'react'
import { Card, Form, Table, Button } from 'react-bootstrap'

import { InputRow, PersonInput, StringInput, EmailInput, InstitutionInput } from '../components/Input'
import { useQuery } from 'react-query'
import api from '../api'

export default function SelectPersonBlock({ title, label, person, setPerson, active, done, change, prefix}) {
    // input dell'utente
    const [lastName, setLastName] = useState('')
    const [firstName, setFirstName] = useState('')
    const [email, setEmail] = useState('')
    const [affiliations, setAffiliations] = useState([])

    // attiva la modalità di aggiornamento dei dati
    const [edit, setEdit] = useState(true)

    if (!active) return <Card className="shadow mb-3">
        <Card.Header>
            <div className="d-flex d-row justify-content-between">
                <div>{label}: <strong>{person?.firstName} {person?.lastName}</strong> ({person.affiliations?.map(_ => _.name).join(', ') || '???'})</div>                    
                <div className="btn btn-warning btn-sm" onClick={change}>Cambia persona</div>
            </div>
        </Card.Header>
    </Card>

    return <Card className="shadow mb-3">
        <Card.Header className="">{title || "Selezione persona"}</Card.Header>
        <Card.Body>

            {!person && <>
                <p>Cerca la persona nel database:</p>
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
                        <InstitutionInput value={affiliations} setValue={setAffiliations} multiple={true} />
                    </InputRow>
                </Form>
                Solo se la persona non esiste, inserisci tutti i dati e poi
                <Button className="mx-3" onClick={createNew} disabled={!lastName || !firstName || !email || !affiliations.length}>
                    Crea una nuova persona
                </Button>
                <PersonSuggestions query={{lastName, firstName, email, affiliation: (affiliations?.length ? affiliations[0]._id : '')}} onClick={clickPerson} prefix={prefix}/>
            </>}

            {person && edit && <>
                <Form className="mb-3">
                    <InputRow label="cognome">
                        <strong>{lastName}</strong>
                    </InputRow>
                    <InputRow label="nome">
                        <strong>{firstName}</strong>
                    </InputRow>
                    <InputRow label="email">
                        <EmailInput value={email} setValue={setEmail} />
                    </InputRow>
                    <InputRow label="affiliazione">
                        <InstitutionInput value={affiliations} setValue={setAffiliations} multiple={true} />
                    </InputRow>
                    <Button className="m-3" onClick={save}>
                        Salva
                    </Button> 
                    <Button className="m-3" onClick={cancel}>
                        Annulla
                    </Button>
                </Form>
            </>}

            {/* mostra i dati */}
            {person && !edit && <>
                <p>La persona è già presente nel database.
                    Controlla i dati...
                    {} { email 
                        ? "è cambiato l'email?"
                        : "puoi inserire l'email?"}
                    {} { affiliations.length 
                        ? "è cambiata l'affiliazione?"
                        : "puoi inserire l'affiliazione?"}
                </p>
                <div>
                    <div>cognome: <strong>{lastName}</strong></div>
                    <div>nome: <strong>{firstName}</strong></div>
                    <div>email: <strong>{email}</strong></div>
                    <div>affiliazione: <strong>{affiliations.map(affiliation => affiliation.name).join(', ')}</strong></div>
                </div>
                <Button className="m-3" onClick={() => setEdit(true)}>
                    Aggiorna i dati di questa persona
                </Button>
                <Button className="m-3" onClick={save}>
                    Scegli questa persona
                </Button>
                <Button className="m-3" onClick={() => {
                        setAffiliations([]);setLastName('');setFirstName('');setEmail('');
                        setPerson(null);setEdit(true)}}>
                    Cerca un'altra persona
                </Button>
            </>} 
        </Card.Body>
        {/* <Card.Footer>
            <pre>
                {JSON.stringify({person, edit, active, lastName, firstName, email, affiliations}, null, 2)}
            </pre>
        </Card.Footer> */}
    </Card>

    function clickPerson(person) {
        setLastName(person.lastName)
        setFirstName(person.firstName)
        setEmail(person.email)
        setAffiliations([...person.affiliations])
        setPerson(person)
        setEdit(false)
    }

    function diff() {
        const patch = {}
        if (person?.lastName !== lastName) patch.lastName = lastName
        if (person?.firstName  !== firstName) patch.firstName = firstName
        if (person?.email !== email) patch.email = email
        if (person?.affiliations?.map(_ => _._id).join(',') !== affiliations.map(_ => _._id).join(',')) patch.affiliations = affiliations.map(_ => _._id)
        if (Object.keys(patch).length === 0) return null
        console.log(`diff patch: ${JSON.stringify(patch)} from ${JSON.stringify(person)} to ${JSON.stringify({lastName, firstName, email, affiliations})}`)
        return patch
    }

    async function createNew() {
        const res = await api.post(`/api/v0/${prefix}/person`, {
            lastName,
            firstName,
            email,
            affiliations: affiliations.map(affiliation => affiliation._id),
        })
        setPerson({
            _id: res._id,
            lastName,
            firstName,
            email,
            affiliations,
        })
        done()
    }

    async function save() {
        const patch = diff();
        console.log(`patch: ${JSON.stringify(patch)}`)
        if (patch) {
            await api.patch(`/api/v0/${prefix}/person/${person._id}`, patch)
            setPerson({...person, ...patch})
        }
        done()
    }

    function cancel() {
        setLastName(person.lastName)
        setFirstName(person.firstName)
        setEmail(person.email)
        setAffiliations([...person.affiliations])
        setEdit(false)
    }
}

function PersonSuggestions({query, onClick, prefix}) {
    const {isLoading, error, data} = useQuery([...`${prefix}/person`.split('/'), query])

    if (error) return "Error: " + error.message
    if (!isLoading && data.data.length === 0) return null

    return <Table hover>
        <thead>
            <tr><th>cognome</th><th>nome</th><th>email</th><th>affiliazione</th></tr>
        </thead>
        <tbody>
        {isLoading && <tr><td colSpan="4">Loading</td></tr>}
        {!isLoading && data.data.map(person => 
            <tr key={person._id} onClick={() => onClick(person)}>
                <td>{person.lastName}</td>
                <td>{person.firstName}</td>
                <td>{person.email}</td>
                <td>{person.affiliations.map(x => x.name).join(", ")}</td>
            </tr>)}
        </tbody>
    </Table>
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


