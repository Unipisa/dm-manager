import { Button, Card, Form } from 'react-bootstrap'
import { ModelInput } from '../components/ModelInput'
import { useState } from 'react'
import { useEngine } from '../Engine'

export default function AddSeminar() {
    const [speaker, setSpeaker] = useState(null)
    const [speakerBlockDisabled, setSpeakerBlockDisabled] = useState(false)
    const [seminarDetailsBlockDisabled, setSeminarDetailsBlockDisabled] = useState(true)

    const onSpeakerSelected = x => {
        setSpeaker(x)
        setSpeakerBlockDisabled(true)
        setSeminarDetailsBlockDisabled(false)
    }

    const speakerBlock = <div  className={speakerBlockDisabled ? "d-none" : "d-block"}>
        <SelectPersonBlock onCompleted={onSpeakerSelected}></SelectPersonBlock>
    </div>;

    const seminarDetails = <div className={seminarDetailsBlockDisabled ? "d-none" : "d-block"}>
        <SeminarDetailsBlock speaker={speaker}></SeminarDetailsBlock>
    </div>

    return <div>
        <h1 className="text-primary pb-4">Nuovo Seminario</h1>
        {speakerBlock}
        {seminarDetails}
    </div>;
}

function SeminarDetailsBlock({ speaker, onCompleted }) {
    const [confirm, setConfirm] = useState(false)

    return <Card className="shadow">
        <Card.Header>Dettagli del seminario [speaker: <strong>{speaker?.firstName} {speaker?.lastName}</strong>]</Card.Header>
        <Card.Body>
        <Form>
            <Form.Group className="my-3">
                <ModelInput field="Titolo" schema={{ type: "string" }}></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Data e ora" schema={{ format: "date-time", widget: "datetime" }}></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Durata (in minuti)" schema={{ type: "number" }}></ModelInput>
            </Form.Group>
            <Form.Group className="my-3">
                <ModelInput field="Aula" schema={{ "x-ref": "ConferenceRoom" }}></ModelInput>
            </Form.Group>
        </Form>
        <div className="d-flex flex-row justify-content-end">
            <Button className="text-end" onClick={() => onCompleted()} disabled={! confirm}>Conferma</Button>
        </div>
        </Card.Body>
    </Card>;
}

function SelectPersonBlock({ onCompleted }) {
    const [person, setPerson] = useState(null)
    const [confirm, setConfirm] = useState(person !== null)

    const onSpeakerSelected = x => {
        setPerson(x)
        setConfirm(x !== null)
    }

    return <div>
        <Card className="shadow">
            <Card.Header>Selezione speaker</Card.Header>
            <Card.Body>
            <Form>
                <Form.Group>
                    <ModelInput field="Speaker" schema={{'x-ref': 'Person'}} value={person} setValue={onSpeakerSelected}></ModelInput>
                </Form.Group>
            </Form>
            <div className="d-flex flex-row justify-content-end">
                <Button className="text-end" onClick={() => onCompleted(person)} disabled={! confirm}>Conferma</Button>
            </div>
            </Card.Body>
        </Card>
        
    </div>
}