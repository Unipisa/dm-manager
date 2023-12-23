import { Button, Card, Form } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import axios from 'axios'
import { DateTime, Interval } from 'luxon'
import { Converter } from 'showdown'

import { ConferenceRoomInput, GrantInput, InputRow, NumberInput, PersonInput, SeminarCategoryInput, StringInput, TextInput } from '../components/Input'
import { DatetimeInput } from '../components/DatetimeInput'

export default function AddSeminar() {
    const [person, setPerson] = useState(null)
    const [title, setTitle] = useState("")
    const [date, setDate] = useState(null)
    const [duration, setDuration] = useState(60)
    const [room, setRoom] = useState(null)
    const [category, setCategory] = useState(null)
    const [abstract, setAbstract] = useState("")
    const [grants, setGrants] = useState(null)
    const [externalid, setExternalId] = useState("")
    const [dataLoaded, setDataLoaded] = useState(false)
    const [forbiddenSeminar, setForbiddenSeminar] = useState(false)

    const { id } = useParams()
    const navigate = useNavigate()

    const search = new URLSearchParams(window.location.search)
    const preFill = search.get("prefill")

    useEffect(() => {
        async function fetchData() {
            var seminar = {}
            if (id) {
                const res = await api.get(`/api/v0/process/seminars/get/${id}`)
                seminar = res.data[0]

                // If the seminar could not be loaded, then either it does not exist, or it 
                // was created by another use. Either way, we need to give an understandable
                // error to the end user. 
                if (! seminar) {
                    setForbiddenSeminar(true)
                    return;
                }
            }

            if (preFill !== null) {
                seminar = await loadExternalData(preFill, seminar)
            }
            
            // Load the data into the state
            seminar.speaker && setPerson(seminar.speaker)
            seminar.title && setTitle(seminar.title)
            seminar.startDatetime && setDate(seminar.startDatetime)
            seminar.duration && setDuration(seminar.duration)
            seminar.room && setRoom(seminar.conferenceRoom)
            seminar.category && setCategory(seminar.category)
            seminar.grants && setGrants(seminar.grants)
            seminar.abstract && setAbstract(seminar.abstract)
            seminar.externalid && setExternalId(seminar.externalid)
        }

        if (! dataLoaded) {
            setDataLoaded(true)
            fetchData()
        }
    }, [id, preFill, dataLoaded])

    if (forbiddenSeminar) {
        return <div>
            <h4>Accesso negato</h4>
            <p>
                Il seminario selezionato non esiste, oppure è stato creato da un altro utente.
                Nel secondo caso, solo l'utente che l'ha originariamente creato (o un amministratore) 
                può modificarne il contenuto. 
            </p>
            <p>
                Nel caso sia necessario l'intervento di un amministratore, scrivere 
                all'indirizzo <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a>.
            </p>
        </div>
    }

    const onCompleted = async () => {
        // Insert the seminar in the database
        const s = {
            title: title, 
            startDatetime: date, 
            duration: duration,
            conferenceRoom: room._id, 
            speaker: person._id,
            category: category._id,
            grants: grants,
            abstract: abstract,
            externalid: externalid
        }

        if (id) {
            s._id = id
        }

        try {
            await api.put('/api/v0/process/seminars/save', s)
            navigate('/process/seminars')
        }
        catch (error) {
            console.log(error)
        }
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
            grants={grants} setGrants={setGrants}
            onCompleted={onCompleted}
        ></SeminarDetailsBlock>
    </div>;
}

function SeminarDetailsBlock({ onCompleted, disabled, room, setRoom, date, setDate, title, setTitle, 
        duration, setDuration, category, setCategory, abstract, setAbstract, grants, setGrants }) {
    const confirm_enabled = (title !== "") && (date !== null) && (duration > 0) && (room !== null) && (category !== null)

    if (disabled) {
        return <></>
    }

    return <Card className="shadow">
        <Card.Header>Dettagli del seminario</Card.Header>
        <Card.Body>
        <Form>
            <InputRow label="Titolo" className="my-3">
                <StringInput value={title} setValue={setTitle} />
            </InputRow>
            <InputRow label="Ciclo di seminari" className="my-3">
                <SeminarCategoryInput value={category} setValue={setCategory} api_prefix="/api/v0/process/seminars/add" />
            </InputRow>
            <InputRow label="Data e ora" className="my-3">
                <DatetimeInput value={date} setValue={setDate}/>
            </InputRow>
            <InputRow className="my-3" label="Durata (in minuti)">
                <NumberInput value={duration} setValue={setDuration}/>
            </InputRow>
            <InputRow className="my-3" label="Aula">
                <ConferenceRoomInput value={room} setValue={setRoom} api_prefix="/api/v0/process/seminars/add"/>
            </InputRow>
            <InputRow className="my-3" label="Grant">
                <GrantInput multiple={true} value={grants} setValue={setGrants} api_prefix="/api/v0/process/seminars/add"/>
            </InputRow>
            <InputRow className="my-3" label="Abstract">
                <TextInput value={abstract} setValue={setAbstract}/>
            </InputRow>
        </Form>
        <div className="d-flex flex-row justify-content-end">
            <Button className="text-end" onClick={onCompleted} disabled={! confirm_enabled}>Salva</Button>
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
            Digitare le prime lettere del cognome per attivare il completamento. Solo se lo speaker non esiste, crearne uno nuovo selezionando 
            la voce che appare nel menù a tendina. All'atto della creazione, inserire nome, cognome e istituzione nella loro lingua di appartenenza
            (ad esempio, "Universität Zürich" piuttosto che "University of Zurich").
            </p>
            <Form className="mb-3">
                <InputRow label="Speaker">
                    <PersonInput value={person} setValue={setPerson} api_prefix="/api/v0/process/seminars/add"/>
                </InputRow>
            </Form>
            </Card.Body>
        </Card>        
    </div>
}

async function loadExternalData(source, seminar) {
    if (! source || ! source.includes(':')) {
        return
    }

    console.log("Loading external data from source: " + source)

    const externalSource = source.split(":")

    switch (externalSource[0]) {
        case 'indico':
            if (externalSource.length !== 2) {
                console.log("Unsupported formato for Indico import: " + source)
            }
            else {
                return await loadIndicoData(externalSource[1], seminar)
            }
            break;
        default:
            console.log("Unsupported source specified, aborting")
    }

    return seminar
}

async function loadIndicoData(indico_id, seminar) {
    const res = await axios.get(`https://events.dm.unipi.it/export/event/${indico_id}.json`)
    const indico_seminar = res.data.results[0]
    
    seminar.title = indico_seminar.title

    if (! seminar.abstract) {
        const converter = new Converter()
        seminar.abstract = converter.makeMarkdown(indico_seminar.description)
    }

    const startDatetime = DateTime.fromFormat(
        indico_seminar.startDate.date + " " + indico_seminar.startDate.time,
        'yyyy-MM-dd HH:mm:ss', 
        { zone: indico_seminar.startDate.tz })
    const endDatetime = DateTime.fromFormat(
        indico_seminar.endDate.date + " " + indico_seminar.endDate.time,
        'yyyy-MM-dd HH:mm:ss', 
        { zone: indico_seminar.endDate.tz })

    seminar.startDatetime = startDatetime.toJSDate()
    seminar.duration = (Interval.fromDateTimes(startDatetime, endDatetime)).length('minutes')

    // Try to match the category, if possible
    const res_cat = (await axios.get('/api/v0/public/seminar-categories', {
        params: { name: indico_seminar.category }
    })).data
    if (res_cat && res_cat.data && res_cat.data.length > 0) {
        seminar.category = res_cat.data[0]
        console.log(seminar.category)
    }

    // Try to match the speaker by email? Right now Indico does not export this information, 
    // so we cannot really do it. 

    seminar.externalid = `indico:${indico_id}`

    return seminar
}