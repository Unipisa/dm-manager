import { useQuery, useQueryClient } from 'react-query'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../api'
import { useState } from 'react'
import { ModalDeleteDialog } from '../components/ModalDialog'
import { formatDate } from '../components/DatetimeInput'
import { useEngine } from '../Engine'

export default function ManageConferences() {

    return (
        <ConferenceList></ConferenceList>
    )
}

function ConferenceList() {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteObjectName, setDeleteObjectName] = useState(null)
    const [deleteConferenceId, setDeleteConferenceId] = useState(null)

    const queryClient = useQueryClient()
    const { isLoading, error, data } = useQuery([ 'process', 'conferences' ])

    if (isLoading) {
        return "Loading"
    }

    if (error) {
        return "Error: " + error.message
    }

    const deleteConference = async (response) => {
        setDeleteConferenceId(null)
        setDeleteObjectName(null)
        setShowDeleteDialog(false)

        if (! response) {
            return
        }
        try {
            await api.del("/api/v0/process/conferences/" + deleteConferenceId)
        }
        catch {
            console.log("Error while deleting the conference")
        }
        
        queryClient.invalidateQueries([ 'process', 'conferences' ])
    }

    const confirmDeleteConference = async (id) => {
        setDeleteConferenceId(id)
        setDeleteObjectName("l'evento")
        setShowDeleteDialog(true)
    }

    return <>
        <h1 className="text-primary pb-0">Gestione convegni</h1>
        <ModalDeleteDialog show={showDeleteDialog} objectName={deleteObjectName} handleClose={deleteConference}></ModalDeleteDialog>
        <a href="/process/conferences/add">
            <button className="btn btn-primary my-3">Nuovo convegno</button>
        </a>
        <div className="row">
            {data.data.map(conference => 
                <div className="p-3 col-lg-6 p-0" key={"conference-" + conference._id}>
                    <Conference conference={conference} onDelete={() => confirmDeleteConference(conference._id)} />
                </div>
            )}
        </div>
        <hr />
        <div>
        <i>Chi può accedere a questa pagina?</i><br />
        Questa pagina è accessibile a tutti gli utenti 
        con permesso <i>/process/conferences</i>. Tale permesso è automatico 
        per gli utenti che hanno una delle seguenti qualifiche interne al dipartimento:
        'PO', 'PA', 'RIC', 'RTDb', 'RTDa', 
        'Assegnista', 'Dottorando', 
        'Professore Emerito',
        'Collaboratore',
        'Personale in quiescenza',
        'PTA'.
        </div>
    </>
}

function Conference({conference, onDelete}) {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')

    return <Card className="shadow">
        <Card.Header className="h6">
            <div className="d-flex d-row justify-content-between">
                <div>Convegno</div>
                {isAdmin && <a href={`/event-conference/${conference._id}`}>{conference._id}</a>}
            </div>
        </Card.Header>
        <Card.Body>
            <strong>Titolo</strong>: {conference.title} <br></br>
            <strong>Data inizio</strong>: {formatDate(conference.startDate, false)}<br></br>
            <strong>Data fine</strong>: {formatDate(conference.endDate, false)}<br></br>
            <div className="mt-2 d-flex flex-row justify-content-end">                        
                {onDelete && <button className="ms-2 btn btn-danger" onClick={onDelete}>
                    Elimina
                </button>}
                <Link className="ms-2" to={"/process/conferences/add/" + conference._id}>
                    <button className="btn btn-primary">
                        Modifica
                    </button>
                </Link>
            </div>
        </Card.Body>                
    </Card>
}