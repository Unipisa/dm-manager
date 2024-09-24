import { Button, Card, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import axios from 'axios'
import { DateTime, Interval } from 'luxon'
import { Converter } from 'showdown'
import { useQuery } from 'react-query'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'

import {SelectPeopleBlock} from './SelectPeopleBlock'
import { ConferenceRoomInput, GrantInput, InputRow, NumberInput, SeminarCategoryInput, StringInput, TextInput } from '../components/Input'
import { DatetimeInput } from '../components/DatetimeInput'
import { PrefixProvider } from './PrefixProvider'
import Loading from '../components/Loading'
import { myDatetimeFormat, setter } from '../Engine'
import { useEngine } from '../Engine'

export default function Seminar() {
    const { id } = useParams()

    const search = new URLSearchParams(window.location.search)
    const preFill = search.get("prefill")

    const { isLoading, error, data } = useQuery([ 'process', 'seminar', id, preFill ], async function () {
        var seminar = {
            speakers: [], 
            title: "", 
            stateDatetime: null,
            duration: 60,
            conferenceRoom: null,
            category: null,
            abstract: "",
            grants: null, 
            externalid: "",
        }

        if (id) {
            const res = await api.get(`/api/v0/process/seminars/get/${id}`)
            seminar = res.data.length>0 ? res.data[0] : null

            // If the seminar could not be loaded, then either it does not exist, or it 
            // was created by another user. Either way, we need to give an understandable
            // error to the end user. 
            if (! seminar) {
                return;
            }

            seminar._id = id
        }

        if (preFill !== null) {
            seminar = await loadExternalData(preFill, seminar)
        }

        return {
            seminar, 
            forbidden: !seminar
        }            
    })

    if (isLoading) return <Loading error={error}></Loading>
    if (error) return <div>{`${error}`}</div>

    if (!data) {
        return "Errore: seminario non trovato"
    }

    return <SeminarBody seminar={data.seminar} forbidden={data.forbidden }/>
}

export function SeminarBody({ seminar, forbidden }) {
    const [data, setData] = useState(seminar)
    const navigate = useNavigate()

    if (forbidden) {
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
        await api.put('/api/v0/process/seminars/save', data)
        navigate('/process/seminars')
    }

    return <PrefixProvider value="process/seminars">
        <h1 className="text-primary pb-4">
            { seminar._id 
                ? "Modifica seminario" 
                : "Inserimento nuovo seminario" }
        </h1>
        <SeminarDetailsBlock 
            data={data} setData={setData}
            onCompleted={onCompleted}
            active={true}
        />
    </PrefixProvider>
}

export function SeminarDetailsBlock({ onCompleted, data, setData, change, active, error }) {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')

    const requirement = (() => {
        if (!data.speakers || data.speakers.length === 0) return "Inserire almeno uno speaker"
        if (data.title === "") return "Inserire il titolo del seminario"
        if (data.startDatetime === null) return "Inserire la data di inizio del seminario"
        if (data.duration <= 0) return "Inserire la durata del seminario"
        if (!data.conferenceRoom) return "Inserire l'aula in cui si svolge il seminario"
        return ""
    })()

    return <PrefixProvider value="process/seminars">
        <Card className="shadow">
            <Card.Header>
            <div className="d-flex d-row justify-content-between">
                    <div>
                        Dettagli del seminario
                    </div>
                    <div>
                        { isAdmin && data._id && <a href={`/event-seminar/${data._id}`}>{data._id}</a>}
                        { change && !active &&  
                        <Button className="text-end btn-warning btn-sm mx-1" onClick={change}>
                            Modifica
                        </Button>
                    }</div>
                </div>  
            </Card.Header>
            <Card.Body>
            { active ? <>
                <Form>
                    <InputRow label="Speakers" className="my-3">
                        <SelectPeopleBlock 
                            people={data.speakers || []} setPeople={people => setData(data => ({...data,speakers: people}))} 
                            prefix="process/seminars"
                        /> 
                    </InputRow>
                    <InputRow label="Organizzaori" className="my-3">
                        <SelectPeopleBlock
                            people={data.organizers || []} setPeople={people => setData(data => ({...data,organizers: people}))}
                            prefix="process/seminars"
                        />
                    </InputRow>
                    <InputRow label="Titolo" className="my-3">
                        <StringInput value={data.title} setValue={setter(setData,'title')} />
                    </InputRow>
                    <InputRow label="Ciclo di seminari" className="my-3">
                        <div className="d-flex align-items-center">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                                Si prega di selezionare tra uno dei cicli di seminari presenti nella lista. 
                                Se il ciclo di seminari che cerchi è assente, si prega di contattare <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a></Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>                
                            <SeminarCategoryInput value={data.category} setValue={setter(setData,'category')} disableCreation={true}/>
                        </div>
                    </InputRow>
                    <InputRow label="Data e ora" className="my-3">
                        <DatetimeInput value={data.startDatetime} setValue={setter(setData,'startDatetime')}/>
                    </InputRow>
                    <InputRow className="my-3" label="Durata (in minuti)">
                        <NumberInput value={data.duration} setValue={setter(setData,'duration')}/>
                    </InputRow>
                    <InputRow className="my-3" label="Aula">
                        <div className="d-flex align-items-center">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                                Si ricorda che la prenotazione su <a href="https://rooms.dm.unipi.it/">Rooms</a> non è automatica
                                e va effettuata indipendentemente</Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>   
                            <ConferenceRoomInput value={data.conferenceRoom} setValue={setter(setData,'conferenceRoom')} disableCreation={true}/>
                        </div>
                    </InputRow>
                    <InputRow className="my-3" label="Grant">
                        <div className="d-flex align-items-center">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                                Se utilizzate uno dei grant afferenti al Dipartimento, si prega di inserirlo
                                cercando tramite il nome del grant oppure il cognome del PI (nazionale)</Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>   
                            <GrantInput multiple={true} value={data.grants || []} setValue={setter(setData,'grants')}/>
                        </div>
                    </InputRow>
                    <InputRow className="my-3" label="Abstract">
                        <div className="d-flex align-items-start">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                                Si ricorda che potete scrivere sia in LaTex (utilizzando $ per le formule) 
                                che in Markdown <a href="https://www.markdownguide.org/">https://www.markdownguide.org/</a>
                                <br />
                                L'anteprima dell'abstract verrà mostrata più sotto mentre scrivi.
                                </Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>   
                            <TextInput value={data.abstract} setValue={setter(setData,'abstract')}/>
                        </div>
                    </InputRow>
                </Form>
                {error && <div className="alert alert-danger">{error}</div>}
                {requirement && <div className="alert alert-warning">{requirement}</div>}
                <div className="d-flex flex-row justify-content-end">
                    <Button className="text-end" onClick={onCompleted} disabled={requirement !== ''}>Salva</Button>
                </div>
            </> : <>
                speakers: <b>{data.speakers && data.speakers.map((p,i) => <>{i>0 && ', '}{p.firstName} {p.lastName} ({p.affiliations.map(x => x.name).join(', ')})</>)}</b><br/>
                organizers: <b>{data.organizers && data.organizers.map((p,i)=><>{i>0 && ', '}{p.firstName} {p.lastName}</>)}</b><br />
                titolo: <b>{data.title}</b><br/>
                ciclo: <b>{data.category?.label || data.category?.name || '---'}</b><br/>
                data: <b>{myDatetimeFormat(data.startDatetime)}</b><br/>
                durata: <b>{data.duration}</b><br/>
                aula: <b>{data.conferenceRoom && data.conferenceRoom.name}</b><br/>
                grant: <b>{(data.grants && data.grants.map(g => g.name).join(', ')) || '---'}</b><br/>
                abstract: <b>{data.abstract}</b><br/>
                creato da: <b>{data.createdBy?.username || data.createdBy?.email || '???'}</b><br/>
            </>}
            </Card.Body>

            {/* <Card.Footer>
                {JSON.stringify({data})}
            </Card.Footer> */}
        </Card>
            { data.abstract && 
                <Card className="shadow" style={{maxWidth:"60em"}}>
                    <Card.Header>Anteprima abstract</Card.Header>
                    <Card.Body>
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{data.abstract}</Markdown>
                    </Card.Body>
                </Card>
            }
</PrefixProvider>
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