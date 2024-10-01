import { useQuery, useQueryClient } from 'react-query'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Loading from '../components/Loading'
import { myDateFormat } from '../Engine'
import { ConfirmDeleteButton } from '../components/ModalDialog'
import api from '../api'
import { useEngine } from '../Engine'

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
        <hr />
        <div>
        <i>Chi può accedere a questa pagina?</i>
        <br />
        {variant === 'my/' && <>
            Tutte le persone inserite in anagrafica possono vedere le 
            visite di cui sono responsabili.
        </>}
        {variant === '' && <>
            Solo chi ha il permesso <i>/process/visists</i> {}
            può gestire tutte le visite terminate da non più di 30 giorni.
            Contattare gli amministratori
            {} <a href="mailto:help@dm.unipi.it">[help@dm.unipi.it]</a> {}
            se c'è la necessita di modificare le visite più vecchie.
        </>}
        </div>
    </>
}

function Rooms({variant, id}) {
    const path = `process/${variant||''}visits/${id}`
    const query = useQuery(path.split('/'))
    if (query.isLoading) return <Loading />
    if (query.isError) return <div>Errore caricamento: {query.error.response.data?.error || `${query.error}`}</div>
    if (!query.data) return <div>No data available</div>;

    let visit = {...query.data}

    if (! visit.requireRoom) return <div>
        <strong>Ufficio</strong>: non richiesto
    </div>
    else if (visit.roomAssignments?.length > 0) return visit.roomAssignments.map(r => 
        <div key={r._id}>
            <strong>Ufficio</strong>: 
            edificio {r.room.building}, {r.room.floor === '0' ? 'piano terra' : 
            r.room.floor === '1' ? 'primo piano' : 
            r.room.floor === '2' ? 'secondo piano' : 
            'piano ' + r.room.floor}, 
            ufficio {r.room.number},
            dal {myDateFormat(r.startDate)} al {myDateFormat(r.endDate)}
        </div>)
    else return <div>
        <strong>Ufficio</strong>: da assegnare
    </div>
}

function VisitList({variant}) {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')
    const queryClient = useQueryClient()
    const { isLoading, error, data } = useQuery(`process/${variant}visits`.split('/'))

    if (isLoading) {
        return "Loading"
    }

    if (!data) {
        return "Error: " + error.message
    }

    return <>
        {data.data.sort(sortFn).map(
            visit => {
            return <div className="p-3 col-lg-6 p-0" key={visit._id}>
                <Card className="shadow">
                    <Card.Header className="h6">
                        <div className="d-flex d-row justify-content-between">
                            <div>Visita</div>
                            {isAdmin && <a href={`/visit/${visit._id}`}>{visit._id}</a>}
                        </div>
                    </Card.Header>
                    <Card.Body>
                        {/*JSON.stringify(visit)*/}
                        <strong>Visitatore</strong>: {visit.person.firstName} { visit.person.lastName } ({visit.affiliations.map(x => x.name).join(", ")})<br />
                        {variant === '' && visit.referencePeople.length > 0 && (
                                <>
                                    <strong>{visit.referencePeople.length > 1 ? "Referenti" : "Referente"}</strong>: { 
                                    visit.referencePeople.map(p => (
                                        `${p.firstName} ${p.lastName}`
                                    )).join(", ")}
                                    <br />
                                </>
                            )}
                        <strong>Periodo</strong>: {myDateFormat(visit.startDate)} – {myDateFormat(visit.endDate)}<br />
                        <Rooms variant={variant} id={visit._id} />
                        <div className="mt-2 d-flex flex-row justify-content-end">                        
                            {
                            <ConfirmDeleteButton className="ms-2 btn btn-danger" objectName={`la visita di ${visit.person.firstName} ${visit.person.lastName}`} onConfirm={() => removeVisit(visit._id)}>
                                Elimina
                            </ConfirmDeleteButton>}
                            <Link className="ms-2" to={`/process/${variant}visits/${visit._id}`}>
                                <button className="btn btn-primary">
                                    Modifica / Visualizza
                                </button>
                            </Link>
                        </div>
                    </Card.Body>                
                </Card>
            </div>
        })}
    </>

    async function removeVisit(id) {
        await api.del(`/api/v0/process/${variant}visits/${id}`)
        queryClient.invalidateQueries(`process/${variant}visits`.split('/'))
    }

    function sortFn(a, b) {
        if (a.startDate < b.startDate) return 1
        if (a.startDate > b.startDate) return -1
        return 0
    }

}