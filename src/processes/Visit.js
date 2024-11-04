import { Button, Card, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'

import { SelectPersonBlock, SelectPeopleBlock } from './SelectPeopleBlock'
import { GrantInput, InputRow, DateInput, StringInput, TextInput, SelectInput } from '../components/Input'
import { PrefixProvider } from './PrefixProvider'
import api from '../api'
import Loading from '../components/Loading'
import {myDateFormat,setter} from '../Engine'
import RoomAssignmentHelper from '../components/RoomAssignmentHelper'
import {SeminarDetailsBlock} from './Seminar'
import { useEngine } from '../Engine'

export default function Visit({variant}) {
    // variant è '' per /process/visit
    // ed è 'my/' per /process/my/visit

    const { id } = useParams()
    const path = `process/${variant||''}visits/${id || '__new__'}`
    const query = useQuery(path.split('/'))
    const user = useEngine().user
    if (query.isLoading) return <Loading />
    if (query.isError) return <div>Errore caricamento: {query.error.response.data?.error || `${query.error}`}</div>

    let visit = {...query.data}

    // set SSD from user staffs info
    if (id === '__new__' && variant === 'my/') {
        for (const staff of user.staffs) {
            if (staff.SSD) visit.SSD = staff.SSD
        }
    }

    return <VisitForm visit={visit} variant={variant||''}/>
}

function VisitForm({visit, variant}) {
    const [data, setData] = useState(visit)
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [activeSection, setActiveSection] = useState(visit ? 'data' : '')
    const [seminar, setSeminar] = useState(null)
    const [existingSeminars, setExistingSeminars] = useState(() => data.seminars || []);
    const user = useEngine().user
    const roomAssignments = visit.roomAssignments
    const canCreateSeminar = user.hasProcessPermission('/process/seminars')
    const addMessage = useEngine().addMessage

    return <PrefixProvider value={`process/${variant}visits`}>
        <h1 className="text-primary pb-4">{visit._id 
            ? "Modifica visita inserita"
            : "Inserimento nuova visita"}</h1>
        <VisitDetailsBlock
            data={data}
            setData={setData} 
            active={activeSection==='data'} 
            done={() => {save();nextStep()}} 
            edit={() => setActiveSection('data')}
            variant={variant}
            fetchSeminars={fetchSeminars}
        />
        { (data.requireRoom || roomAssignments?.length>0)  &&
            <RoomAssignments 
                visit={visit}
                person={data.person}
                roomAssignments={roomAssignments} 
                active={activeSection==='room'}
                done={nextStep}
                edit={() => setActiveSection('room')}
                variant={variant}
                onChange={save /* save visit to force notification */} 
            />
        }
        {   // mostra il pulsante per inserire un nuovo seminario
            data.requireSeminar && !seminar && canCreateSeminar &&
            <Card className="shadow mb-3">
                <Card.Header>
                <div className="d-flex d-row justify-content-between align-items-center">
                        <div>
                            Seminario
                        </div>
                        <div> 
                            <Button className="text-end btn-warning btn-sm" onClick={newSeminar} disabled={errorVisit()}>
                                Inserisci seminario
                            </Button>
                        </div>
                    </div>  
                </Card.Header>
                <Card.Body>
                    { errorVisit() ? (
                        <div className="text-danger">{errorVisit()}</div>
                    ) : (
                        <>
                            { existingSeminars.length > 0 ? (
                                <div className="text-warning">
                                    { existingSeminars.length === 1 
                                        ? "C'è già un seminario inserito nel periodo della visita. Per inserire comunque un nuovo seminario premere il pulsante 'Inserisci seminario'"
                                        : "Ci sono già seminari inseriti nel periodo della visita. Per inserire comunque un nuovo seminario premere il pulsante 'Inserisci seminario'"
                                    }
                                </div>
                            ) : (
                                <i>Per inserire un seminario per il visitatore premere il pulsante 'Inserisci seminario'</i>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>
        }
        {   // mostra il form per inserire un nuovo seminario
            seminar && <Seminar seminar={seminar}
                change={canCreateSeminar ? () => setActiveSection(seminar._id || 'seminar') : null}
                active={activeSection==='seminar' || (seminar._id && activeSection===seminar._id)}
                done={() => {
                    setActiveSection('');
                    setSeminar(null);
                    save(); // save visit to force notification
                    fetchSeminars(data);
                }}
                variant={variant}
                />
        }
        {   // mostra i seminari già inseriti
            data.requireSeminar && data.startDate && data.endDate && data.person?._id && 
            <Card className="shadow mb-3">
                <Card.Header>Seminari già inseriti</Card.Header>
                <Card.Body>
                    {(() => {
                        return existingSeminars.length ? (
                            <>
                                <div className="mb-2">
                                    <i>I seguenti seminari sono stati già inseriti per il visitatore nel periodo selezionato:</i>
                                </div>
                                {existingSeminars.map(seminar => (
                                    <div key={seminar._id} className="mb-2">
                                        <Seminar seminar={seminar} 
                                        active={activeSection===seminar._id} 
                                        change={() => setActiveSection(seminar._id)}
                                        done={() => {
                                            setActiveSection('')
                                            save() // save visit to force notification
                                        }}
                                        variant={variant}
                                        />
                                    </div>
                                ))}
                            </>
                        ) : (
                            <i>Nessun seminario trovato nel periodo selezionato</i>
                        )
                    })()}
                </Card.Body>
            </Card>
        }
        <Button className="mt-3" onClick={completed}>
            Indietro
        </Button>
    </PrefixProvider>

    function newSeminar() {
        setSeminar({speakers: [data.person], organizers: [...data.referencePeople], grants: [...data.grants]})
        setActiveSection('seminar')
    }

    function errorVisit() {
        if (!data.startDate || !data.endDate || new Date(data.startDate) > new Date(data.endDate)
            || data.referencePeople.length === 0 ) {
            return "Prima di poter inserire un seminario terminare di inserire i dati necessari della visita"
        }
    }

    function nextStep() {
        let section = activeSection
        section = {
            'person': 'data',
            'data': ''
        }[section]
        setActiveSection(section)
        console.log(`nextStep: ${section}`)
    }

    function fetchSeminars(newData) {
        const queryParams = {
            startDate: new Date(newData.startDate).toISOString().split('T')[0],
            endDate: new Date(newData.endDate).toISOString().split('T')[0]
        }
        
        api.get(`/api/v0/process/visits/seminars/${data.person._id}`, queryParams).then(res => {
            setExistingSeminars(res.data || [])
        }).catch(err => {
            addMessage(`Error fetching seminars: ${err}`)
        })
    }
    
    async function save() {
        if (data.person.affiliations && !data.affiliations?.length) {
            data.affiliations = data.person.affiliations
        }
        // data.affiliations = data.affiliations.map(_ => typeof(_) === 'object' ? _._id : _)
        if (visit._id) {
            try {
                await api.patch(`/api/v0/process/${variant}visits/${visit._id}`, data)
            } catch (e) {
                addMessage(`${e}`)
            }
        } else {
            const res = await api.put(`/api/v0/process/${variant}visits`, data)
            const _id = res._id
            console.log(`save response: ${JSON.stringify(res)}`)
            navigate(`/process/${variant}visits/${_id}`, {replace: true})
        }
        queryClient.invalidateQueries(`process/${variant}visits`.split('/'))
    }

    async function completed() {
        navigate(`/process/${variant}visits`)     
    }
}

function VisitDetailsBlock({data, setData, active, done, edit, variant, fetchSeminars}) {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')

    return <Card className="shadow mb-3">
        <Card.Header>
            <div className="d-flex d-row justify-content-between">
                <div>Dettagli della visita</div>
            {!active && 
                <div>
                    {isAdmin && <a href={`/visit/${data._id}`}>{data._id}</a>}
                    <Button className="text-end btn-warning btn-sm mx-1" onClick={edit}>Modifica</Button>
                </div>}
            </div>
        </Card.Header>
        <Card.Body>
        { active 
        ? <ActiveVisitDetailsBlock data={data} setData={setData} done={done} variant={variant} fetchSeminars={fetchSeminars}/>
        : <>
            visitatore: <b>{data.person.firstName} {data.person.lastName} ({data.person.affiliations.map(a=>a.name).join(', ')}) {data.person.email}</b>
            {data.referencePeople.map(person => <div key={person._id}>referente: <b>{person.firstName} {person.lastName}</b> &lt;<a href={`mailto:${person.email}`}>{person.email}</a>&gt;<br/></div>)}
            <br />
            periodo: <b>{myDateFormat(data.startDate)} – {myDateFormat(data.endDate)}</b>
            <br />
            tema: <b>{data.collaborationTheme}</b>
            <br />
            SSD: <b>{data.SSD}</b>
            <br />
            grants: {data?.grants?.length ? data.grants.map(grant => <span key={grant._id}><b>{grant.identifier}</b>&nbsp;</span>) : <i>nessun grant utilizzato</i>}
            <br />
            fondi di ateneo: <b>{data.universityFunded ? 'sì' : 'no'}</b>
            <br />
            albergo: <b>{data.requireHotel || '???'}</b>
            <br />
            ufficio: {data.requireRoom ? <b>è richiesto un ufficio in Dipartimento</b> : <>non è richiesto un ufficio in Dipartimento</>}
            <br />
            seminario: {data.requireSeminar ? <b>è previsto un seminario</b> : <>non è previsto un seminario</>}
            <br />
            note: <b>{ data.notes || 'nessuna nota'}</b>
        </>}
        </Card.Body>
    </Card>
}

function ActiveVisitDetailsBlock({data, setData, done, variant, fetchSeminars}) {
    return <>
        <Form autoComplete="off">
            <InputRow label="Visitatore" className="my-3">
                <SelectPersonBlock 
                    title="Selezione visitatore" 
                    person={data.person} 
                    canEdit={true}
                    canChange={true}
                    setPerson={setter(setData, 'person')} 
                    prefix={`process/${variant}visits`}
                />
            </InputRow>
            <InputRow label="Referenti" className="my-3">
                <div className="d-flex align-items-center">
                    <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                        Se la visita è gestita da più persone, inserisci tutti i referenti
                        così che tutti possano vedere i dati e fare modifiche</Tooltip>}>
                        <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                    </OverlayTrigger>
                    <SelectPeopleBlock
                        people={data.referencePeople || []} setPeople={setReferencePeople}
                        prefix="process/visits"
                    />
                </div>
            </InputRow>
            <InputRow label="Data arrivo" className="my-3">
                <DateInput value={data.startDate} setValue={startDateSetter}/>
            </InputRow>
            <InputRow label="Data partenza" className="my-3">
            <DateInput value={data.endDate} setValue={endDateSetter} defaultDate={data.startDate}/>
            </InputRow>    
            <InputRow label="Tema collaborazione" className="my-3" l>
                <div className="d-flex align-items-start">
                    <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                        Indicare il tema della collaborazione da inserire nella lettera di incarico che Francesca dovrà scrivere. 
                        Se il tema non è ancora definito inserire 'TBA' e aggiungere successivamente.</Tooltip>}>
                        <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                    </OverlayTrigger>
                    <StringInput value={data.collaborationTheme} setValue={setter(setData, "collaborationTheme")}/>
                </div>
            </InputRow>
            <InputRow label="SSD" className="my-3">
                <SelectInput value={data.SSD} setValue={setter(setData, "SSD")} options={["MAT/01", "MAT/02", "MAT/03", "MAT/04", "MAT/05", "MAT/06", "MAT/07", "MAT/08", "MAT/09",""]}/>
            </InputRow>
            <InputRow className="my-3" label="Grants">
                <div className="d-flex align-items-center">
                    <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                        Se utilizzate uno dei grant afferenti al Dipartimento, si prega di inserirlo
                        cercando tramite il nome del grant oppure il cognome del PI (nazionale)</Tooltip>}>
                        <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                    </OverlayTrigger>
                    <GrantInput multiple={true} value={data.grants} setValue={setter(setData, 'grants')} disableCreation={true}/>
                </div>
            </InputRow>
            <InputRow className="my-3" label="Fondi di Ateneo">
                <div className="d-flex align-items-center">
                    <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                        Se utilizzate i vostri fondi di Ateneo per la visita, si prega di spuntare la corrispondente casella</Tooltip>}>
                        <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                    </OverlayTrigger>
                    <input type="checkbox" checked={data.universityFunded} onChange={e => setData({...data, universityFunded: e.target.checked})} style={{marginRight: '5px'}}/>
                    {} Visita su fondi di Ateneo
                </div>
            </InputRow>
            <InputRow className="my-3" label="Prenotazione albergo">
                <div className="d-flex align-items-center">
                    <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                        Le prenotazioni di alberghi per visitatori singoli devono essere fatte indipendentemente dal visitatore. 
                        Si ricorda che le spese di pernottamento verranno rimborsate per un massimo di €180 a notte</Tooltip>}>
                        <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                    </OverlayTrigger>
                    <SelectInput value={data.requireHotel || "non richiesto"} setValue={setter(setData, "requireHotel")} options={["non richiesto", "prenotazione indipendente"]}/>
                </div>
            </InputRow>
            <InputRow className="my-3" label="Ufficio in Dipartimento">
                <div className="d-flex align-items-center">
                    <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                        Se volete che venga assegnata una postazione in un ufficio in Dipartimento, si prega di spuntare la corrispondente casella</Tooltip>}>
                        <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                    </OverlayTrigger>                
                    <input type="checkbox" checked={data.requireRoom} onChange={e => setData({...data, requireRoom: e.target.checked})} style={{marginRight: '5px'}}/>
                    {} Richiedi un ufficio in Dipartimento
                </div>
            </InputRow>
            <InputRow className="my-3" label="Seminario">
                <div className="d-flex align-items-center">
                    <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                        Se un seminario per lo speaker nel periodo della visita è stato già inserito apparirà sotto</Tooltip>}>
                        <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                    </OverlayTrigger>  
                    <input 
                        type="checkbox" 
                        checked={data.requireSeminar} 
                        onChange={e => {
                            const newData = {...data, requireSeminar: e.target.checked}
                            setData(newData)
                            if (e.target.checked && newData.startDate && newData.endDate && newData.person?._id) {
                                fetchSeminars(newData)
                            }
                        }} 
                        style={{marginRight: '5px'}}
                    />
                    {} È previsto un seminario
                </div>
            </InputRow>
            <InputRow className="my-3" label="Note">
                <div className="d-flex align-items-start">
                    <OverlayTrigger placement="left" overlay={<Tooltip id="grants-tooltip">
                    Si consiglia di utilizzare le note per scrivere tutte le info rilevanti per Francesca</Tooltip>}>
                        <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                    </OverlayTrigger>
                    <TextInput value={data.notes} setValue={setter(setData, "notes")}/>
                </div>
            </InputRow>
        </Form>
        <div className="d-flex flex-row justify-content-end">
            <Button className="text-end" onClick={done} disabled={error()}>Salva</Button>       
        </div>
        { error() && <div className="text-danger">{error()}</div>}
    </>

    function handleDataChange(newData) {
        setData(newData)
        if (newData.startDate && newData.endDate && newData.person?._id && newData.requireSeminar) {            
            fetchSeminars(newData)
        }
    }

    function startDateSetter(value) {
        const endDate = data.endDate || value
        handleDataChange({
            ...data,
            startDate: value,
            endDate
        })
    }

    function endDateSetter(value) {
        handleDataChange({
            ...data,
            endDate: value
        })
    }

    function error() {
        if (!data.startDate) return "Data di arrivo non inserita"
        if (!data.endDate) return "Data di partenza non inserita"
        if (new Date(data.startDate) > new Date(data.endDate)) return "Data di arrivo successiva alla data di partenza"
        if (!data.collaborationTheme) return "Tema della collaborazione non inserito (scrivere 'TBA' se non ancora definito e aggiungere successivamente)"
        if (data.referencePeople.length === 0) return "Inserire almeno un referente per la visita"
    }

    function setReferencePeople(people) {
        setData(data => ({...data, referencePeople: people}))
        if (!data.SSD) {
            for (const person of people) {
                if (!person.staffs) continue
                for (const staff of person.staffs) {
                    if (staff.SSD) {
                        setData(data => ({...data, SSD: staff.SSD}))
                    }
                }
            }
        }
    }
}

function RoomAssignments({person, visit, roomAssignments, active, done, edit, variant, onChange}) {
    return <Card className="shadow mb-3">
        <Card.Header>
            <div className="d-flex d-row justify-content-between">
                <div>Assegnazione ufficio in Dipartimento</div>
                <div>
                    {variant === 'my/' && "[gestito dalla segreteria]"}
                    {variant === '' && !active &&
                        <Button className="text-end btn-warning btn-sm" onClick={edit}>
                            Modifica
                        </Button>}
                </div>
            </div>  
        </Card.Header>
        <Card.Body>
            {active 
                ? <RoomAssignmentHelper person={person} startDate={visit.startDate} endDate={visit.endDate} onChange={onChange}/>
                : <RoomAssignmentsDisplay />
            }
        </Card.Body>
    </Card>

    function RoomAssignmentsDisplay() {
        if (roomAssignments?.length > 0) return roomAssignments.map(r => 
            <li key={r._id}>
                ufficio <b>{r.room.code}</b>: {}
                edificio {r.room.building}, {r.room.floor === '0' ? 'piano terra' : 
                r.room.floor === '1' ? 'primo piano' : 
                r.room.floor === '2' ? 'secondo piano' : 
                'piano ' + r.room.floor}, 
                ufficio {r.room.number} dal <b>{myDateFormat(r.startDate)}</b> al <b>{myDateFormat(r.endDate)}</b>
            </li>)
        else return <i>
            nessun ufficio in Dipartimento assegnato nel periodo della visita
        </i>
    }
}

function Seminar({seminar, change, active, done, variant}) {
    const [data, setData] = useState(seminar)
    const [error, setError] = useState('')
    const queryClient = useQueryClient()
    const user = useEngine().user

    const canModifySeminar = user.hasProcessPermission('/process/seminars')

    return <SeminarDetailsBlock data={data} setData={setData} onCompleted={save} disabled={!canModifySeminar} change={change} active={active} error={error}/>

    async function save() {
        setError('')
        console.log(`save seminar: ${JSON.stringify(data)}`)
        try {
            if (data._id) {
                await api.patch(`/api/v0/process/seminars/${data._id}`, data)
            } else {
                await api.post(`/api/v0/process/seminars`, data)
                queryClient.invalidateQueries(`process/${variant}visits`.split('/'))
            }
            done()
        } catch (e) {
            setError(e.response?.data.error || e?.message || `${e}`)
        }
    }
}
