import { useState } from 'react'
import { Card, Form, Table, Button } from 'react-bootstrap'

import { InputRow, PersonInput, StringInput, EmailInput, InstitutionInput } from '../components/Input'
import { useQuery } from 'react-query'
import api from '../api'

export default function SelectPersonBlock({ title, label, person, setPerson, active, done, cancel}) {
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
