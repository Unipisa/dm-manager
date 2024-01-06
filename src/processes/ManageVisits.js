import { useQuery, useQueryClient } from 'react-query'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../api'

import { myDateFormat } from '../Engine'

export default function ManageVisits() {
    return <>
        <h1 className="text-primary pb-0">Gestione visite</h1>
        <a href="/process/visits/add">
            <button className="btn btn-primary my-3">Nuova visita</button>
        </a>
        <div className="row">
            <VisitList />
        </div>
    </>
}

function VisitList() {
    const queryClient = useQueryClient()
    const { isLoading, error, data } = useQuery([ 'process', 'visits' ])

    if (isLoading) {
        return "Loading"
    }

    if (!data) {
        return "Error: " + error.message
    }

    const deleteVisit = async (id) => {
        await api.del("/api/v0/process/visits/" + id)        
        queryClient.invalidateQueries([ 'process', 'visits' ])
    }

    return data.data.map(
            visit => {
            return <div className="p-3 col-lg-6 p-0" key={visit._id}>
                <Card className="shadow">
                    <Card.Header className="h6">Visita</Card.Header>
                    <Card.Body>
                        {/*JSON.stringify(visit)*/}
                        <strong>Visitatore</strong>: {visit.person.firstName} { visit.person.lastName } ({visit.affiliations.map(x => x.name).join(", ")})<br />
                        <strong>Periodo</strong>: {myDateFormat(visit.startDate)} – {myDateFormat(visit.endDate)}<br />
                        <div className="mt-2 d-flex flex-row justify-content-end">                        
                            <button className="ms-2 btn btn-danger" onClick={() => deleteVisit(visit._id)}>
                                Elimina
                            </button>
                            <Link className="ms-2" to={"/process/visits/add/" + visit._id}>
                                <button className="btn btn-primary">
                                    Modifica
                                </button>
                            </Link>
                        </div>
                    </Card.Body>                
                </Card>
            </div>
            })
}