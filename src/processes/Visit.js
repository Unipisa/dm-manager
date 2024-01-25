import { Button, Card, Form } from 'react-bootstrap'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'

import SelectPersonBlock from './SelectPersonBlock'
import { GrantInput, InputRow, DateInput, TextInput } from '../components/Input'
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
    if (query.isLoading) return <Loading />
    if (query.isError) return <div>Errore caricamento: {query.error.response.data?.error || `${query.error}`}</div>

    return <VisitForm visit={query.data} variant={variant||''}/>
}

function VisitForm({visit, variant}) {
    const [data, setData] = useState(visit)
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [activeSection, setActiveSection] = useState(data.person ? '' : 'person')
    const [seminar, setSeminar] = useState(null)
    const user = useEngine().user
    const seminars = visit.seminars
    const roomAssignments = visit.roomAssignments
    const canCreateSeminar = user.hasProcessPermission('/process/seminars')

    return <PrefixProvider value={`process/${variant}visits`}>
        <h1 className="text-primary pb-4">{visit._id 
            ? "Modifica visita inserita"
            : "Inserimento nuova visita"}</h1>
        <SelectPersonBlock 
            title="Selezione visitatore" 
            label="Visitatore" 
            person={data.person} setPerson={setter(setData, 'person')} 
            done={nextStep}
            change={() => {setData({...data, person: null});setActiveSection('person')}}
            active={activeSection==='person'}
            prefix={`/api/v0/process/${variant}visits`}
        />
        { data.person && 
            <VisitDetailsBlock
                data={data} 
                setData={setData} 
                active={activeSection==='data'} 
                done={() => {save();nextStep()}} 
                edit={() => setActiveSection('data')}
            />}
        { (data.requireRoom || roomAssignments?.length>0)  &&
            <RoomAssignments 
                visit={visit}
                person={data.person}
                roomAssignments={roomAssignments} 
                active={activeSection==='room'}
                done={nextStep}
                edit={() => setActiveSection('room')}
                variant={variant}
            />
        }
        {   // mostra i seminari già inseriti
            seminars &&
            seminars.map(seminar => <div key={seminar._id}>
            <Seminar seminar={seminar} 
                active={activeSection===seminar._id} 
                change={() => setActiveSection(seminar._id)}
                done={() => {setActiveSection('')}}
                variant={variant}
                />
        </div>)}
        {   // mostra il pulsante per inserire un nuovo seminario
            (!seminars || seminars.length === 0) && data.requireSeminar && !seminar && canCreateSeminar &&
            <Card className="shadow">
                <Card.Header>
                <div className="d-flex d-row justify-content-between">
                        <div>
                            Seminario
                        </div>
                        <div> 
                            <Button className="text-end btn-warning btn-sm" onClick={newSeminar}>
                                Inserisci seminario
                            </Button>
                        </div>
                    </div>  
                </Card.Header>
                <Card.Body>
                    <i>nessun seminario inserito nel periodo della visita</i>
                </Card.Body>
            </Card>
        }
        {   // mostra il form per inserire un nuovo seminario
            seminar && <Seminar seminar={seminar}
                change={canCreateSeminar ? () => setActiveSection(seminar._id || 'seminar') : null}
                active={activeSection==='seminar' || (seminar._id && activeSection===seminar._id)}
                done={() => {setActiveSection('');setSeminar(null)}}
                variant={variant}
                />
        }
        <Button className="mt-3" onClick={completed}>
            Indietro
        </Button>
    </PrefixProvider>

    function newSeminar() {
        setSeminar({speaker: data.person, grants: [...data.grants]})
        setActiveSection('seminar')
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

    async function save() {
        if (data.person.affiliations && !data.affiliations?.length) {
            data.affiliations = data.person.affiliations
        }
        data.affiliations = data.affiliations.map(_ => _._id)
        if (visit._id) {
            await api.patch(`/api/v0/process/${variant}visits/${visit._id}`, data)
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

function VisitDetailsBlock({data, setData, active, done, edit}) {
    return <Card className="shadow mb-3">
        <Card.Header>
            <div className="d-flex d-row justify-content-between">
                <div>Dettagli della visita</div>
            {!active && 
                <div>
                    <Button className="text-end btn-warning btn-sm" onClick={edit}>Modifica</Button>
                </div>}
            </div>
        </Card.Header>
        <Card.Body>
        { active 
        ? <ActiveVisitDetailsBlock data={data} setData={setData} done={done} />
        : <>
            periodo: <b>{myDateFormat(data.startDate)} – {myDateFormat(data.endDate)}</b>
            <br />
            grants: {data?.grants?.length ? data.grants.map(grant => <span key={grant._id}><b>{grant.identifier}</b>&nbsp;</span>) : <i>nessun grant utilizzato</i>}
            <br />
            stanza: {data.requireRoom ? "è richiesta una stanza" : "non è richiesta una stanza"}
            <br />
            seminario: {data.requireSeminar ? "è previsto un seminario" : "non è previsto un seminario"}
            <br />
            note: <b>{ data.notes || 'nessuna nota'}</b>
        </>}
        </Card.Body>
    </Card>
}

function ActiveVisitDetailsBlock({data, setData, done}) {
    return <>
        <Form>
            <InputRow label="Data arrivo" className="my-3">
                <DateInput value={data.startDate} setValue={setter(setData, "startDate")}/>
            </InputRow>
            <InputRow label="Data partenza" className="my-3">
                <DateInput value={data.endDate} setValue={setter(setData, "endDate")}/>
            </InputRow>
            <InputRow className="my-3" label="Grants">
                <GrantInput multiple={true} value={data.grants} setValue={setter(setData,'grants')} />
            </InputRow>
            <InputRow className="my-3" label="Stanza">
                <input type="checkbox" checked={data.requireRoom} onChange={e => setData({...data, requireRoom: e.target.checked})}/>
                {} Richiedi una stanza
            </InputRow>
            <InputRow className="my-3" label="Seminario">
                <input type="checkbox" checked={data.requireSeminar} onChange={e => setData({...data, requireSeminar: e.target.checked})}/>
                {} E' previsto un seminario
            </InputRow>
            <InputRow className="my-3" label="Note">
                <TextInput value={data.notes} setValue={setter(setData, "notes")}/>
            </InputRow>
        </Form>
        <div className="d-flex flex-row justify-content-end">
            <Button className="text-end" onClick={done} disabled={!check()}>Salva</Button>
        </div>
    </>

    function check() {
        return data.startDate && data.endDate && new Date(data.startDate) <= new Date(data.endDate)
    }
}

function RoomAssignments({person, visit, roomAssignments, active, done, edit, variant}) {
    return <Card className="shadow mb-3">
        <Card.Header>
            <div className="d-flex d-row justify-content-between">
                <div>Assegnazione stanza</div>
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
                ? <RoomAssignmentHelper person={person} startDate={visit.startDate} endDate={visit.endDate} />
                : <RoomAssignmentsDisplay />
            }
        </Card.Body>
    </Card>

    function RoomAssignmentsDisplay() {
        if (roomAssignments?.length > 0) return roomAssignments.map(r => 
            <li key={r._id}>
                stanza <b>{r.room.code}</b>: {}
                dal <b>{myDateFormat(r.startDate)}</b> al <b>{myDateFormat(r.endDate)}</b>
            </li>)
        else return <i>
            nessuna stanza assegnata nel periodo della visita
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
