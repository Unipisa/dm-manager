import { Button, Card, Form } from 'react-bootstrap'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'

import SelectPersonBlock from './SelectPersonBlock'
import { GrantInput, InputRow, DateInput, TextInput } from '../components/Input'
import { PrefixProvider } from './PrefixProvider'
import api from '../api'
import Loading from '../components/Loading'
import {useEngine, myDateFormat} from '../Engine'

export default function AddVisit() {
    const { id } = useParams()
    const query = useQuery(['process', 'visits', 'get', id || 'new'])
    if (query.isLoading) return <Loading />
    if (query.isError) return <div>Errore caricamento {query.error}</div>

    return <AddVisitForm visit={query.data}/>
}

function AddVisitForm({visit}) {
    const [data, setData] = useState(visit)
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [activeSection, setActiveSection] = useState(data.person ? '' : 'person')
    const user = useEngine().user

    return <PrefixProvider value="/api/v0/process/visits/add">
        <h1 className="text-primary pb-4">{visit._id 
            ? "Modifica visita inserita"
            : "Inserimento nuova visita"}</h1>
        <SelectPersonBlock 
            title="Selezione visitatore" 
            label="Visitatore" 
            person={data.person} setPerson={setter(setData, 'person')} 
            done={nextStep}
            cancel={() => {setData({...data, person: null});setActiveSection('person')}}
            active={activeSection==='person'}
        />
        { data.person && 
            <VisitDetailsBlock 
                data={data} 
                setData={setData} 
                active={activeSection==='data'} 
                done={nextStep} 
                edit={() => setActiveSection('data')}
            />}
        <Button className="m-3" onClick={completed}>Salva</Button>
        <Button classname="m-3 btn-warning" onClick={cancel}>Annulla</Button>
    </PrefixProvider>

    function nextStep() {
        let section = activeSection
        section = {
            'person': 'data',
            'data': 'room'
        }[section]
        setActiveSection(section)
    }

    async function completed() {
        if (data.person.affiliations && !data.affiliations?.length) {
            data.affiliations = data.person.affiliations
        }
        data.affiliations = data.affiliations.map(_ => _._id)
        api.put('/api/v0/process/visits/save', data)
        queryClient.invalidateQueries(['process', 'visits'])
        navigate('/process/visits')     
    }

    function cancel() {
        navigate('/process/visits')
    }
}

function VisitDetailsBlock({data, setData, active, done, edit}) {
    return <Card>
        <Card.Header>Dettagli della visita</Card.Header>
        <Card.Body>
        { active 
        ? <><Form>
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
            <Button className="text-end" onClick={done} disabled={!check()}>Fatto</Button>
        </div></>
        : <>
            periodo: <b>{myDateFormat(data.startDate)} - {myDateFormat(data.endDate)}</b>
            <br />
            grants: {data.grants ? data.grants.map(grant => <><b>{grant.identifier}</b>&nbsp;</>) : 'nessun grant'}
            <br />
            {data.requireRoom ? "è richiesta una stanza" : "non è richiesta una stanza"}
            <br />
            {data.requireSeminar ? "è previsto un seminario" : "non è previsto un seminario"}
            <br />
            note: <b>{ data.notes || 'nessuna nota'}</b>
            <div className="d-flex flex-row justify-content-end">
                <Button className="text-end btn-warning btn-sm" onClick={edit}>Modifica</Button>
            </div>
        </>
        }
        </Card.Body>
    </Card>

    function check() {
        return data.startDate && data.endDate && data.startDate <= data.endDate
    }
}

function setter(setData, key) {
    return (value) => {
        setData(data => ({ ...data, [key]: value }))
    }
}
