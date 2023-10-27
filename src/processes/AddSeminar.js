import { Button, Card, Form } from 'react-bootstrap'
import { ModelInput } from '../components/ModelInput'
import { useState } from 'react'
import EventSeminar from '../models/EventSeminar'
import { useEngine } from '../Engine'

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

        console.log(s)

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
        <SelectPersonBlock person={person} setPerson={setPerson} disabled={person != null}></SelectPersonBlock>
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
    const confirm_enabled = (title != "") && (date != null) && (duration > 0) && (room != null) && (category != null)

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