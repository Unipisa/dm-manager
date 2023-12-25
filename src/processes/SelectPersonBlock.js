import { Card, Form } from 'react-bootstrap'

import { InputRow, PersonInput } from '../components/Input'

export default function SelectPersonBlock({ title, label, person, setPerson }) {
    return <div>
        <Card className="shadow mb-3">
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
                    <PersonInput value={person} setValue={setPerson} />
                </InputRow>
            </Form>
            </Card.Body>
        </Card>        
    </div>
}
