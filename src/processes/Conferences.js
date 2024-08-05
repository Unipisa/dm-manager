import { useQuery, useQueryClient } from 'react-query'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../api'
import { useState } from 'react'
import { ModalDeleteDialog } from '../components/ModalDialog'
import { formatDate } from '../components/DatetimeInput'

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

    var conference_block = []

    for (var i = 0; i < data.data.length; i++) {
        const conference = data.data[i]
        conference_block.push(
            <div className="p-3 col-lg-6 p-0" key={"conference-" + conference._id}>
            <Card className="shadow">
                <Card.Header className="h6">Evento</Card.Header>
                <Card.Body>
                    <strong>Titolo</strong>: {conference.title} <br></br>
                    <strong>Data inizio</strong>: {formatDate(conference.startDate, false)}<br></br>
                    <strong>Data fine</strong>: {formatDate(conference.endDate, false)}<br></br>
                    <div className="mt-2 d-flex flex-row justify-content-end">                        
                        <button className="ms-2 btn btn-danger" onClick={() => confirmDeleteConference(conference._id)}>
                            Elimina
                        </button>
                        <Link className="ms-2" to={"/process/conferences/add/" + conference._id}>
                            <button className="btn btn-primary">
                                Modifica
                            </button>
                        </Link>
                    </div>
                </Card.Body>                
            </Card>
            </div>
        )
    }

    return <>
        <h1 className="text-primary pb-0">Gestione eventi</h1>
        <ModalDeleteDialog show={showDeleteDialog} objectName={deleteObjectName} handleClose={deleteConference}></ModalDeleteDialog>
        <a href="/process/conferences/add">
            <button className="btn btn-primary my-3">Nuovo evento</button>
        </a>
        <div className="row">
            {conference_block}
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