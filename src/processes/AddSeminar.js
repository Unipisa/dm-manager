import { Button, Card, Form } from 'react-bootstrap'
import { ModelInput } from '../components/ModelInput'
import { useState } from 'react'
import { useEngine } from '../Engine'
import axios from 'axios'

export default function AddSeminar() {
    const [person, setPerson] = useState(null)
    const [title, setTitle] = useState("")
    const [date, setDate] = useState(null)
    const [duration, setDuration] = useState(60)
    const [room, setRoom] = useState(null)
    const [category, setCategory] = useState(null)
    const [seminarAdded, setSeminarAdded] = useState(false)

    const engine = useEngine()
    const putSeminar = engine.usePut('event-seminar')

    const onCompleted = async () => {
        // Insert the seminar in the database
        const s = {
            title: title, 
            startDatetime: date, 
            duration: duration, 
            conferenceRoom: room, 
            speaker: person,
            category: category
        }

        if (await putSeminar(s)) {
            setSeminarAdded(true)
        }
        else {
            console.log("error")
        }
    }

    if (seminarAdded) {
        return <div>
            <p>Seminario inserito correttamente.</p>
            <a href="/"><button className="btn btn-primary">Torna alla home</button></a>
        </div>
    }

    return <div>
        <h1 className="text-primary pb-4">Inserimento nuovo seminario</h1>
        <SelectPersonBlock2 person={person} setPerson={setPerson} disabled={person != null}></SelectPersonBlock2>
        <SeminarDetailsBlock disabled={person == null} 
            title={title} setTitle={setTitle}
            date={date} setDate={setDate}
            duration={duration} setDuration={setDuration}
            room={room} setRoom={setRoom}
            category={category} setCategory={setCategory}
            onCompleted={onCompleted}
        ></SeminarDetailsBlock>
    </div>;
}

function SeminarDetailsBlock({ speaker, onCompleted, disabled, room, setRoom, date, setDate, title, setTitle, duration, setDuration, category, setCategory }) {
    const confirm_enabled = (title !== "") && (date !== null) && (duration > 0) && (room !== null) && (category !== null)

    if (disabled) {
        return <></>
    }

    return <Card className="shadow">
        <Card.Header>Dettagli del seminario</Card.Header>
        <Card.Body>
        <Form>
            <Form.Group className="my-3">
                <ModelInput field="Titolo" schema={{ type: "string" }} value={title} setValue={setTitle}></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Categoria" schema={{ "x-ref": "SeminarCategory" }} value={category} setValue={setCategory}></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Data e ora" schema={{ format: "date-time", widget: "datetime" }} value={date} setValue={setDate}></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Durata (in minuti)" schema={{ type: "number" }} value={duration} setValue={setDuration}></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Aula" schema={{ "x-ref": "ConferenceRoom" }} value={room} setValue={setRoom}></ModelInput>
            </Form.Group>
        </Form>
        <div className="d-flex flex-row justify-content-end">
            <Button className="text-end" onClick={onCompleted} disabled={! confirm_enabled}>Conferma</Button>
        </div>
        </Card.Body>
    </Card>;
}

function SelectPersonBlock2({ onCompleted, disabled, person, setPerson }) {
    const [surname, setSurname] = useState("")
    const [matchedSpeakers, setMatchedSpeakers] = useState([])

    const onSpeakerSelected = x => {
        setPerson(x)
    }

    const searchSpeakers = async x => {
        // Fetch the list of speakers with the given surname
        const surname = x.target.value
        if (surname.length < 2) {
            setMatchedSpeakers([])
        }
        else {
            const res = await axios.get('/api/v0/process/seminars/add/searchPerson', {
                params: { lastName: surname }
            })
            setMatchedSpeakers(JSON.parse(res.data))
        }
        setSurname(surname)
    }

    if (disabled) {
        return <Card className="shadow mb-3">
            <Card.Header>Selezione speaker: <strong>{person?.firstName} {person?.lastName}</strong></Card.Header>
        </Card>
    }

    return <div>
        <Card className="shadow mb-3">
            <Card.Header>Selezione speaker</Card.Header>
            <Card.Body>
            <Form className="mb-3">
                <Form.Group>
                    <Form.Label>Inserire il cognome per attivare il completamento:</Form.Label>
                    <Form.Control type="input" value={surname} onChange={searchSpeakers}></Form.Control>
                </Form.Group>
                <MatchedSpeakersBlock speakers={matchedSpeakers} onSpeakerSelected={onSpeakerSelected}></MatchedSpeakersBlock>
            </Form>
            <div className="d-flex flex-row justify-content-end">
                <Button className="text-end" onClick={() => onCompleted(person)} disabled={person != null}>Conferma</Button>
            </div>
            </Card.Body>
        </Card>        
    </div>
}

function MatchedSpeakersBlock({speakers, onSpeakerSelected}) {
    const onChooseSpeakerClicked = x => {
        onSpeakerSelected(x)
    }

    if (speakers.length == 0) {
        return <div className="my-3">
            <em>Nessuna persona trovata. <br></br>Se la persona cercata non è presente in anagrafica, scrivere a <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a> per richiederne l'inserimento, fornendo nome, affiliazione, indirizzo e-mail.
            </em>
        </div>
    }
    else {
        const speakersBlock = Array.from(speakers).map(x => {
            console.log(x.firstName + " " + x.lastName)
            return <div className="p-3 col-6"><Card className="p-0 m-0">
                <Card.Header>{x.firstName} {x.lastName}</Card.Header>
                <Card.Body>
                    <a href="mailto:{x.email}">{x.email}</a><br></br>
                    <em>{x.affiliations.map(x => x.name)}</em>
                    <div className="flex-row d-flex justify-content-end">
                        <Button className="btn btn-primary" onClick={() => onChooseSpeakerClicked(x)}>Scegli</Button>
                    </div>
                </Card.Body>
            </Card></div>
        })

        console.log(speakersBlock)

        return <div className="my-3">
            <div className="row">
                {speakersBlock}
            </div>
        </div>
    }
}

function SelectPersonBlock({ onCompleted, disabled, person, setPerson }) {
    if (disabled) {
        return <Card className="shadow mb-3">
            <Card.Header>Selezione speaker: <strong>{person?.firstName} {person?.lastName}</strong></Card.Header>
        </Card>
    }

    return <div>
        <Card className="shadow mb-3">
            <Card.Header>Selezione speaker</Card.Header>
            <Card.Body>
            <Form>
                <Form.Group>
                    <ModelInput field="Speaker" schema={{'x-ref': 'Person'}} value={person} setValue={setPerson}></ModelInput>
                </Form.Group>
            </Form>
            <div className="d-flex flex-row justify-content-end">
                <Button className="text-end" onClick={() => onCompleted(person)} disabled={person != null}>Conferma</Button>
            </div>
            </Card.Body>
        </Card>
        
    </div>
}