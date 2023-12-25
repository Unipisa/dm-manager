import { Button, Card, Form } from 'react-bootstrap'
import { useState } from 'react'

import SelectPersonBlock from './SelectPersonBlock'
import { GrantInput, InputRow, DateInput } from '../components/Input'
import { PrefixProvider } from './PrefixProvider'
import { myDateFormat } from '../Engine'

export default function AddVisit() {
    const [data, setData] = useState({
        person: null
    })
    const [detailsDone, setDetailsDone] = useState(false)

    return <PrefixProvider value="/api/v0/process/visits/add">
        <h1 className="text-primary pb-4">Inserimento nuova visita</h1>
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
        { data.person && !detailsDone && <VisitDetailsBlock data={data} setData={setData} onCompleted={() => setDetailsDone(true)}></VisitDetailsBlock> }
        { data.person && detailsDone && <Card className="shadow mb-3">
            <Card.Header>
                <div className="d-flex d-row justify-content-between">
                    <div>Dettagli della visita</div>
                    <div className="btn btn-warning btn-sm" onClick={() => setDetailsDone(false)}>Modifica</div>
                </div>
            </Card.Header>
            <Card.Body>
                <strong>Date:</strong> {myDateFormat(data.startDate)} - {myDateFormat(data.endDate)}<br />
                <strong>Grants:</strong> {data.grants.map(grant => grant.identifier).join(", ")}<br />
            </Card.Body>
        </Card> }
    </PrefixProvider>
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
                <GrantInput multiple={true} value={data.grants} setValue={setter(setData,'grants')} api_prefix="/api/v0/process/visits/add"/>
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
