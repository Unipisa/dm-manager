import { Button, Card, Form } from 'react-bootstrap'

import { ConferenceRoomInput, GrantInput, InputRow, NumberInput, PersonInput, SeminarCategoryInput, StringInput, TextInput } from '../components/Input'

export default function SelectPersonBlock({ label, person, setPerson }) {
    return <div>
        <Card className="shadow mb-3">
            <Card.Header className="">Selezione speaker</Card.Header>
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
                    <PersonInput value={person} setValue={setPerson} api_prefix="/api/v0/process/seminars/add"/>
                </InputRow>
            </Form>
            </Card.Body>
        </Card>        
    </div>
}
