import { Button, Card, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { useQuery } from 'react-query'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'

import { ConferenceRoomInput, GrantInput, InputRow, DateInput, MultipleSelectInput, InstitutionInput, BooleanInput, StringInput, TextInput } from '../components/Input'
import { PrefixProvider } from './PrefixProvider'
import Loading from '../components/Loading'
import { setter, useEngine } from '../Engine'
import { SelectPeopleBlock } from './SelectPeopleBlock'

export default function Conference() {
    const { id } = useParams()

    const { isLoading, error, data } = useQuery([ 'process', 'conference', id ], async function () {
        var conference = { 
            title: "", 
            startDate: null,
            endDate: null,
            SSD: null,
            url: "",
            conferenceRoom: null,
            institution: null,
            isOutreach: null,
            grants: null, 
            description: "",
        }

        if (id) {
            const res = await api.get(`/api/v0/process/conferences/get/${id}`)
            conference = res.data[0]

            // If the conference could not be loaded, then either it does not exist, or it 
            // was created by another user. Either way, we need to give an understandable
            // error to the end user. 
            if (! conference) {
                return;
            }

            conference._id = id
        }

        return {
            conference, 
            forbidden: !conference
        }            
    })

    if (isLoading) return <Loading error={error}></Loading>
    if (error) return <div>{`${error}`}</div>

    return <ConferenceBody conference={data.conference} forbidden={data.forbidden }/>
}

export function ConferenceBody({ conference, forbidden }) {
    const [data, setData] = useState(conference)
    const navigate = useNavigate()

    if (forbidden) {
        return <div>
            <h4>Accesso negato</h4>
            <p>
                Il convegno selezionato non esiste, oppure è stato creato da un altro utente.
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
        // Insert the conference in the database
        await api.put('/api/v0/process/conferences/save', data)
        navigate('/process/conferences')
    }

    return <PrefixProvider value="process/conferences">
        <h1 className="text-primary pb-4">
            { conference._id 
                ? "Modifica convegno" 
                : "Inserimento nuovo convegno" }
        </h1>
        <ConferenceDetailsBlock 
            data={data} setData={setData}
            onCompleted={onCompleted}
            active={true}
        />
    </PrefixProvider>
}

export function ConferenceDetailsBlock({ onCompleted, data, setData, change, active, error }) {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')

    const requirement = (()=>{
        if (!data.title || typeof data.title !== 'string' || data.title.trim() === "") return "inserisci il titolo"
        if (!data.startDate) return "inserisci la data di inizio"
        if (!data.endDate) return "inserisci la data di fine"
        if (new Date(data.startDate) > new Date(data.endDate)) return "Data di arrivo successiva alla data di partenza"
        return ""
    })()

    return <PrefixProvider value="process/conferences">
        <Card className="shadow">
            <Card.Header>
            <div className="d-flex d-row justify-content-between">
                    <div>
                        Dettagli del convegno
                    </div>
                    <div>
                    { isAdmin && data._id && <a href={`/event-congress/${data._id}`}>{data._id}</a>}    
                    { change && !active &&  
                        <Button className="text-end btn-warning btn-sm" onClick={change}>
                            Modifica
                        </Button>
                    }</div>
                </div>  
            </Card.Header>
            <Card.Body>
            { active ? <>
                <Form>
                    <InputRow label="Titolo" className="my-3">
                        <StringInput value={data.title} setValue={setter(setData,'title')}/>
                    </InputRow>
                    <InputRow label="Organizzatori" className="my-3">
                        <SelectPeopleBlock people={data.organizers || []} setPeople={people => setData(data => ({...data, organizers: people}))} prefix="process/conferences"/>
                    </InputRow>
                    <InputRow label="Data di inizio" className="my-3">
                        <DateInput value={data.startDate} setValue={setter(setData,'startDate')}/>
                    </InputRow>
                    <InputRow label="Data di fine" className="my-3">
                        <DateInput value={data.endDate} setValue={setter(setData, 'endDate')}/>
                    </InputRow>
                    <InputRow label="SSD" className="my-3">
                        <MultipleSelectInput 
                            value={data.SSD} 
                            setValue={setter(setData, "SSD")} 
                            options={["MAT/01", "MAT/02", "MAT/03", "MAT/04", "MAT/05", "MAT/06", "MAT/07", "MAT/08", "MAT/09"]}
                        />
                    </InputRow>
                    <InputRow className="my-3" label="Sito web">
                        <div className="d-flex align-items-center">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="url-tooltip">
                                Se il convegno ha un sito web dedicato, inserirlo qui
                                e indirizzare gli utenti a esso nella descrizione.
                                Per inserire un link il formato è [descrizione](url)</Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>   
                            <StringInput value={data.url} setValue={setter(setData,'url')} disableCreation={true}/>
                        </div>
                    </InputRow>
                    <InputRow className="my-3" label="Aula">
                        <div className="d-flex align-items-center">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                                Per la prenotazione di un'aula in Dipartimento si può procedere autonomamente
                                usando <a href="https://rooms.dm.unipi.it/">Rooms</a>,
                                oppure ci si può rivolgere alla segreteria</Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>   
                            <ConferenceRoomInput value={data.conferenceRoom} setValue={setter(setData,'conferenceRoom')} disableCreation={true}/>
                        </div>
                    </InputRow>
                    <InputRow className="my-3" label="Istituzione (solo se diversa da unipi)">
                        <div className="d-flex align-items-center">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="institutions-tooltip">
                                Se il convegno non si svolge al Dipartimento, selezionare un'istituzione
                                e lasciare vuota l'aula</Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>   
                            <InstitutionInput value={data.institution} setValue={setter(setData,'institution')}/>
                        </div>
                    </InputRow>
                    <InputRow className="my-3" label="Terza missione">
                        <div className="d-flex align-items-center">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="third-mission-tooltip">
                                Se il convegno fa parte di un'iniziativa di Terza missione
                                selezionare la casella</Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>   
                            <BooleanInput value={data.isOutreach} setValue={setter(setData,'isOutreach')}/>
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
                    <InputRow className="my-3" label="Descrizione">
                        <div className="d-flex align-items-start">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                                Si ricorda che potete scrivere sia in LaTex (utilizzando $ per le formule) 
                                che in Markdown <a href="https://www.markdownguide.org/">https://www.markdownguide.org/</a>
                                <br />
                                L'anteprima della descrizione verrà mostrata più sotto mentre scrivi.
                                </Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>   
                            <TextInput value={data.description} setValue={setter(setData,'description')}/>
                        </div>
                    </InputRow>
                </Form>
                {error && <div className="alert alert-danger">{error}</div>}
                {requirement && <div className="alert alert-warning">{requirement}</div>}
                <div className="d-flex flex-row justify-content-end">
                    <Button className="text-end" onClick={onCompleted} disabled={requirement!==''}>Salva</Button>
                </div>
            </> : <>
                titolo: <b>{data.title}</b><br/>
                data inizio: <b>{data.startDate}</b><br/>
                data fine: <b>{data.endDate}</b><br/>
                SSD: <b>{data.SSD}</b><br/>
                sito web: <b>{data.url}</b><br/>
                aula: <b>{data.conferenceRoom && data.conferenceRoom.name}</b><br/>
                istituzione: <b>{data.institution}</b><br/>
                terza missione: <b>{data.isOutreach}</b><br/>
                grant: <b>{(data.grants && data.grants.map(g => g.name).join(', ')) || '---'}</b><br/>
                descrizione: <b>{data.description}</b><br/>
                creato da: <b>{data.createdBy?.username || data.createdBy?.email || '???'}</b><br/>
            </>}
            </Card.Body>

            {/* <Card.Footer>
                {JSON.stringify({data})}
            </Card.Footer> */}
        </Card>
            { data.description && 
                <Card className="shadow" style={{maxWidth:"60em"}}>
                    <Card.Header>Anteprima descrizione</Card.Header>
                    <Card.Body>
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{data.description}</Markdown>
                    </Card.Body>
                </Card>
            }
</PrefixProvider>
}
