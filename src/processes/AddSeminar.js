import { Button, Card, Form } from 'react-bootstrap'
import { ModelInput } from '../components/ModelInput'
import { useState } from 'react'
import axios from 'axios'

export default function AddSeminar() {
    const [person, setPerson] = useState(null)
    const [title, setTitle] = useState("")
    const [date, setDate] = useState(null)
    const [duration, setDuration] = useState(60)
    const [room, setRoom] = useState(null)
    const [category, setCategory] = useState(null)
    const [seminarAdded, setSeminarAdded] = useState(false)
    const [abstract, setAbstract] = useState("")

    const onCompleted = async () => {
        // Insert the seminar in the database
        const s = {
            title: title, 
            startDatetime: date, 
            duration: duration, 
            conferenceRoom: room._id, 
            speaker: person._id,
            category: category._id,
            abstract: abstract
        }

        try {
            await axios.put('/api/v0/process/seminars/add/save', s)
            setSeminarAdded(true)
        }
        catch (error) {
            console.log(error)
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
        <SelectPersonBlock person={person} setPerson={setPerson} disabled={person != null}></SelectPersonBlock>
        <SeminarDetailsBlock disabled={person == null} 
            title={title} setTitle={setTitle}
            date={date} setDate={setDate}
            duration={duration} setDuration={setDuration}
            room={room} setRoom={setRoom}
            category={category} setCategory={setCategory}
            abstract={abstract} setAbstract={setAbstract}
            onCompleted={onCompleted}
        ></SeminarDetailsBlock>
    </div>;
}

function SeminarDetailsBlock({ speaker, onCompleted, disabled, room, setRoom, date, setDate, title, setTitle, duration, setDuration, category, setCategory, abstract, setAbstract }) {
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
                <ModelInput field="Categoria" schema={{ "x-ref": "SeminarCategory" }} value={category} setValue={setCategory} api_prefix="/api/v0/process/seminars/add"></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Data e ora" schema={{ format: "date-time", widget: "datetime" }} value={date} setValue={setDate}></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Durata (in minuti)" schema={{ type: "number" }} value={duration} setValue={setDuration}></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Aula" schema={{ "x-ref": "ConferenceRoom" }} value={room} setValue={setRoom} api_prefix="/api/v0/process/seminars/add"></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Abstract" schema={{ type: "string", widget: "text" }} value={abstract} setValue={setAbstract}></ModelInput>
            </Form.Group>
        </Form>
        <div className="d-flex flex-row justify-content-end">
            <Button className="text-end" onClick={onCompleted} disabled={! confirm_enabled}>Conferma</Button>
        </div>
        </Card.Body>
    </Card>;
}

function SelectPersonBlock({ onCompleted, disabled, person, setPerson }) {
    if (disabled) {
        return <Card className="shadow mb-3">
            <Card.Header>
                <div className="d-flex d-row justify-content-between">
                    <div>Selezione speaker: <strong>{person?.firstName} {person?.lastName}</strong></div>                    
                    <div className="btn btn-warning btn-sm" onClick={() => setPerson(null)}>Annulla</div>
                </div>
            </Card.Header>
        </Card>
    }

    return <div>
        <Card className="shadow mb-3">
            <Card.Header className="">Selezione speaker</Card.Header>
            <Card.Body>
            <p>
            Digitare le prime lettere del cognome per attivare il completamento.
            Solo se lo speaker non esiste in anagrafica, crearne uno nuovo selezionando la voce che appare nel menù a tendina.
            </p>
            <Form className="mb-3">
                <ModelInput field="Speaker" schema={{"x-ref": "Person"}} value={person} setValue={setPerson} api_prefix="/api/v0/process/seminars/add"></ModelInput>
            </Form>
            </Card.Body>
        </Card>        
    </div>
}