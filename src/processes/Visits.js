import { useQuery, useQueryClient } from 'react-query'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import { myDateFormat } from '../Engine'

export default function ProcessVisits({variant}) {
    // variant è '' per /process/visits
    // ed è 'my/' per /process/my/visits

    return <>
        <h1 className="text-primary pb-0">Gestione {variant==='my/'?"mie":""} visite</h1>
        <a href={`/process/${variant}visits/__new__`}>
            <button className="btn btn-primary my-3">Nuova visita</button>
        </a>
        <div className="row">
            <VisitList variant={variant}/>
        </div>
        Vengono visualizzate le visite terminate da non più di 30 giorni.
    </>
}

function VisitList({variant}) {
    const queryClient = useQueryClient()
    const { isLoading, error, data } = useQuery(`process/${variant}visits`.split('/'))

    if (isLoading) {
        return "Loading"
    }

    if (!data) {
        return "Error: " + error.message
    }

    return <>
        {data.data.map(
            visit => {
            return <div className="p-3 col-lg-6 p-0" key={visit._id}>
                <Card className="shadow">
                    <Card.Header className="h6">Visita</Card.Header>
                    <Card.Body>
                        {/*JSON.stringify(visit)*/}
                        <strong>Visitatore</strong>: {visit.person.firstName} { visit.person.lastName } ({visit.affiliations.map(x => x.name).join(", ")})<br />
                        <strong>Periodo</strong>: {myDateFormat(visit.startDate)} – {myDateFormat(visit.endDate)}<br />
                        <div className="mt-2 d-flex flex-row justify-content-end">                        
                            {/*
                            <button className="ms-2 btn btn-danger" onClick={() => deleteVisit(visit._id)}>
                                Elimina
                            </button>*/}
                            <Link className="ms-2" to={`/process/${variant}visits/${visit._id}`}>
                                <button className="btn btn-primary">
                                    Modifica
                                </button>
                            </Link>
                        </div>
                    </Card.Body>                
                </Card>
            </div>
        })}
    </>
}