import { Button, Card, Form } from 'react-bootstrap'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'

import SelectPersonBlock from './SelectPersonBlock'
import { GrantInput, InputRow, DateInput, TextInput } from '../components/Input'
import { PrefixProvider } from './PrefixProvider'
import api from '../api'
import Loading from '../components/Loading'

export default function AddVisit() {
    const { id } = useParams()
    const query = useQuery(['process', 'visits', 'get', id || 'new'])
    if (query.isLoading) return <Loading />
    if (query.isError) return <div>Errore caricamento {query.error}</div>

    console.log(`QUERY: ${JSON.stringify(query.data)}`)

    return <AddVisitForm visit={query.data}/>
}

function AddVisitForm({visit}) {
    const [data, setData] = useState(visit)
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    return <PrefixProvider value="/api/v0/process/visits/add">
        <h1 className="text-primary pb-4">{visit._id 
            ? "Modifica visita inserita"
            : "Inserimento nuova visita"}</h1>
        { data.person 
            ? <Card className="shadow mb-3">
                <Card.Header>
                    <div className="d-flex d-row justify-content-between">
                        <div>Selezione visitatore: <strong>{data.person?.firstName} {data.person?.lastName}</strong></div>                    
                        <div className="btn btn-warning btn-sm" onClick={() => setData({...data, person: null})}>Annulla</div>
                    </div>
                </Card.Header>
            </Card>
            : <SelectPersonBlock title="Selezione speaker" label="Seaker" person={data.person} setPerson={setter(setData, 'person')}/>
        }
        { data.person && <VisitDetailsBlock data={data} setData={setData} onCompleted={onCompleted}></VisitDetailsBlock> }
    </PrefixProvider>

    async function onCompleted() {
        api.put('/api/v0/process/visits/save', data)
        queryClient.invalidateQueries(['process', 'visits'])
        navigate('/process/visits')     
    }
}

function VisitDetailsBlock({data, setData, onCompleted}) {
    return <Card className="shadow">
        <Card.Header>Dettagli della visita</Card.Header>
        <Card.Body>
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
            <Button className="text-end" onClick={onCompleted} disabled={!check()}>Salva</Button>
        </div>
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
