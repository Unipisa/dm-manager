import { useQuery, useQueryClient } from 'react-query'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../api'
import { useState } from 'react'

import { ModalDeleteDialog } from '../components/ModalDialog'
import { formatDate } from '../components/DatetimeInput'
import { useEngine } from '../Engine'

export default function ManageSeminars() {

    return (
        <SeminarList></SeminarList>
    )
}

function SeminarList() {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteObjectName, setDeleteObjectName] = useState(null)
    const [deleteSeminarId, setDeleteSeminarId] = useState(null)

    const queryClient = useQueryClient()
    const { isLoading, error, data } = useQuery([ 'process', 'seminars' ])

    if (isLoading) {
        return "Loading"
    }

    if (error) {
        return "Error: " + error.message
    }

    const deleteSeminar = async (response) => {
        setDeleteSeminarId(null)
        setDeleteObjectName(null)
        setShowDeleteDialog(false)

        if (! response) {
            return
        }
        try {
            await api.del("/api/v0/process/seminars/" + deleteSeminarId)
        }
        catch {
            console.log("Error while deleting the seminar")
        }
        
        queryClient.invalidateQueries([ 'process', 'seminars' ])
    }

    const confirmDeleteSeminar = async (id) => {
        setDeleteSeminarId(id)
        setDeleteObjectName("il seminario")
        setShowDeleteDialog(true)
    }

    var seminar_block = []

    for (var i = 0; i < data.data.length; i++) {
        const seminar = data.data[i]
        const speakers = seminar.speakers
        const organizers = seminar.organizers
        seminar_block.push(
            <div className="p-3 col-lg-6 p-0" key={"seminar-" + seminar._id}>
            <Card className="shadow">
                <Card.Header className="h6">
                    <div className="d-flex d-row justify-content-between">
                        <div>Seminario</div>
                        { isAdmin && <a href={`/event-seminar/${seminar._id}`}>{seminar._id}</a> }
                    </div>
                </Card.Header>
                <Card.Body>
                    <strong>Titolo</strong>: {seminar.title} <br></br>
                    <strong>Speaker</strong>: {
                        speakers.map(speaker => (
                            `${speaker.firstName} ${speaker.lastName} (${speaker.affiliations.map(x => x.name).join(", ")})`
                        )).join(", ")}
                    <br />
                    {Array.isArray(organizers) && organizers.length > 0 && (
                        <>
                             <strong>
                                {organizers.length > 1 ? "Organizzatori" : "Organizzatore"}
                            </strong>: {
                                organizers.map(organizer => (
                                    `${organizer.firstName} ${organizer.lastName} (${organizer.affiliations.map(x => x.name).join(", ")})`
                                )).join(", ")}
                            <br />
                        </>
                    )}
                    <strong>Data</strong>: {formatDate(seminar.startDatetime)}<br></br>
                    <div className="mt-2 d-flex flex-row justify-content-end">                        
                        <button className="ms-2 btn btn-danger" onClick={() => confirmDeleteSeminar(seminar._id)}>
                            Elimina
                        </button>
                        <Link className="ms-2" to={"/process/seminars/add/" + seminar._id}>
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
        <h1 className="text-primary pb-0">Gestione seminari</h1>
        <ModalDeleteDialog show={showDeleteDialog} objectName={deleteObjectName} handleClose={deleteSeminar}></ModalDeleteDialog>
        <a href="/process/seminars/add">
            <button className="btn btn-primary my-3">Nuovo seminario</button>
        </a>
        <div className="row">
            {seminar_block}
        </div>
        <hr />
        <div>
        <i>Chi può accedere a questa pagina?</i><br />
        Questa pagina è accessibile a tutti gli utenti 
        con permesso <i>/process/seminars</i>. Tale permesso è automatico 
        per gli utenti che hanno una delle seguenti qualifiche interne al dipartimento:
        'PO', 'PA', 'RIC', 'RTDb', 'RTDa', 'RTT',
        'Assegnista', 'Dottorando', 
        'Professore Emerito',
        'Collaboratore',
        'Personale in quiescenza',
        'PTA'.
        </div>
    </>
}