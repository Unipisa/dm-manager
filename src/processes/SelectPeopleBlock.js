import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { Card, Form, Table, Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { InputRow, StringInput, EmailInput, InstitutionInput } from '../components/Input'
import { useQuery } from 'react-query'
import api from '../api'

export function SelectPeopleBlock({ people, setPeople, prefix}) {
    return <div>
            {people.map((person, i) =>
                <SelectPersonBlock 
                    key={prefix + i}
                    prefix={prefix} 
                    person={person} 
                    setPerson={person => setPeople(people.map((p,j) => i === j ? person : p))}
                    canEdit={true}
                    canCancel={true}
                    onRemove={() => setPeople(people.filter((_,j) => i !== j))}
                    onCancel={() => setPeople(people.slice(0, -1))}
                /> 
            )}
            <div className='btn btn-primary btn-sm m-1' onClick={() => {
                setPeople([...people, null])}}
            >
                Aggiungi { people.length > 0 && "un'altra" } persona
            </div>
        </div>
}

export function SelectPersonBlock({ title, person, setPerson, onFocus, done, prefix, canEdit, canChange, canCancel, onRemove, onCancel}) {
    // input dell'utente
    const [lastName, setLastName] = useState('')
    const [firstName, setFirstName] = useState('')
    const [email, setEmail] = useState('')
    const [affiliations, setAffiliations] = useState([])
    const [mode, setMode] = useState(person ? 'display' : 'search')
    const [showModal, setShowModal] = useState(true);

    // mode:
    // * display: mostra i dati della persona
    // * search: cerca la persona
    // * confirm: conferma la persona
    // * update: modifica i dati della persona

    if (mode === 'display') return <div>
            <div className="d-flex d-row justify-content-between align-items-center">
                <div>
                    <strong>{person?.firstName} {person?.lastName}</strong> {}
                    ({person.affiliations?.map(_ => _.name).join(', ') || '???'}) {}
                    {person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}
                </div>
                <div>
                    { canEdit && <div className='btn btn-warning btn-sm m-1 ' onClick={update}>Aggiorna dati</div>}   
                    { canChange && <div className='btn btn-warning btn-sm m-1' onClick={change}>Cambia persona</div>}
                    { onRemove && <div className='btn btn-danger btn-sm m-1' onClick={onRemove}>Rimuovi</div>}
                </div>
            </div>
        </div>

    if (mode !=='display') return <Modal show={showModal} size="lg" centered>
        {mode === 'search' && <Card className="shadow">
            <Card.Header className="">{title || "Selezione persona"}</Card.Header>
            <Card.Body>
                    <p>Cerca la persona nel database:</p>
                    <Form className="mb-3">
                        <InputRow label="Cognome">
                            <StringInput value={lastName} setValue={setLastName} />
                        </InputRow>
                        <InputRow label="Nome">
                            <StringInput value={firstName} setValue={setFirstName} />
                        </InputRow>
                        <InputRow label="Email">
                            <EmailInput value={email} setValue={setEmail} />
                        </InputRow>
                        <InputRow label="Affiliazione">
                            <div className="d-flex align-items-center">
                                <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                                    È possibile scegliere più di un'affiliazione selezionandone una alla volta, 
                                    oppure selezionare "N/A" per nessuna affiliazione</Tooltip>}>
                                    <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                                </OverlayTrigger>
                                <InstitutionInput value={affiliations} setValue={setAffiliations} multiple={true} />
                            </div>
                        </InputRow>
                    </Form>
                    <PersonSuggestions query={{lastName, firstName, email, affiliation: (affiliations?.length ? affiliations[0]._id : '')}} onClick={clickPerson} prefix={prefix}/>
                    <p><u>Se sei sicuro che la persona non esiste</u>, inserisci tutti i dati e poi
                    <Button className="mx-3" onClick={createNew} disabled={!lastName || !firstName || !email || !affiliations.length}>
                        Crea una nuova persona
                    </Button>
                    </p>
                    {canCancel && <Button className="mx-3" onClick={() => {
                        setShowModal(false);
                        onCancel();
                    }}>
                        Annulla
                    </Button>
                    }
                </Card.Body>
            <Footer />
        </Card>}
        { mode === 'confirm' && <Card className="shadow">
        <Card.Header className="">{title || "Selezione persona"}</Card.Header>
        <Card.Body> 
                <p>Questi sono i dati per questa persona nel database:</p>
                <div>
                    <div>Cognome: <strong>{lastName}</strong></div>
                    <div>Nome: <strong>{firstName}</strong></div>
                    <div>Email: <strong>{email}</strong></div>
                    <div>Affiliazione: <strong>{affiliations.map(affiliation => affiliation.name).join(', ')}</strong></div>
                </div>
                <br />
                <p>
                    <u>Controlla i dati</u>:
                    {} { email 
                        ? "l'indirizzo email è cambiato?"
                        : "puoi inserire l'indirizzo email?"}
                    {} { affiliations.length 
                        ? "l'affiliazione è cambiata?"
                        : "puoi inserire l'affiliazione?"}
                </p>
                <p>Se il nome o il cognome sono sbagliati, scrivi un'email a <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a></p>
                <Button className="m-3" onClick={() => setMode('update')}>
                    Aggiorna i dati di questa persona
                </Button>
                <Button className="m-3" onClick={save}>
                    Scegli questa persona
                </Button>
                <Button className="m-3" onClick={change}>
                    Cerca un'altra persona
                </Button>
        </Card.Body>
        <Footer />
        </Card>
        }
        { mode === 'update' && 
            <Card className="shadow">
            <Card.Header className="">{title || "Selezione persona"}</Card.Header>
            <Card.Body> 
                <Form className="">
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
            </Card.Body>
            <Footer />
        </Card>
        }
    </Modal>

    return <div>invalid mode: {mode}</div>

    function Footer() {
        return
/*        return <Card.Footer>
            <pre>
                {JSON.stringify({person, mode, lastName, firstName, email, affiliations}, null, 2)}
            </pre>
        </Card.Footer>
*/
    }

    function clickPerson(person) {
        setLastName(person.lastName)
        setFirstName(person.firstName)
        setEmail(person.email)
        setAffiliations([...person.affiliations])
        setPerson(person)
        setMode("confirm")
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
        setMode('display')
    }

    async function save() {
        const patch = diff();
        console.log(`patch: ${JSON.stringify(patch)}`)
        if (patch) {
            await api.patch(`/api/v0/${prefix}/person/${person._id}`, patch)
            setPerson({...person, lastName, firstName, email, affiliations})
        }
        setMode('display')
    }

    function cancel() {
        setLastName(person.lastName)
        setFirstName(person.firstName)
        setEmail(person.email)
        setAffiliations([...person.affiliations])
        setMode('display')
    }

    function update() {
        setLastName(person.lastName)
        setFirstName(person.firstName)
        setEmail(person.email)
        setAffiliations([...person.affiliations])
        setMode('update')
        onFocus()
    }

    function change() {
        setLastName('')
        setFirstName('')
        setEmail('')
        setAffiliations([])
        setMode('search')
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
