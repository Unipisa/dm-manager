import { useQuery, useQueryClient } from 'react-query'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../api'
import { useState } from 'react'
import { ModalDeleteDialog } from '../components/ModalDialog'

export default function ManageSeminars() {

    return (
        <SeminarList></SeminarList>
    )
}

function SeminarList() {
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
        const speaker = seminar.speaker
        seminar_block.push(
            <div className="p-3 col-lg-6 p-0" key={"seminar-" + seminar._id}>
            <Card className="shadow">
                <Card.Header className="h6">Seminario</Card.Header>
                <Card.Body>
                    <strong>Titolo</strong>: {seminar.title} <br></br>
                    <strong>Speaker</strong>: {speaker.firstName} { speaker.lastName } ({speaker.affiliations.map(x => x.name).join(", ")})<br></br>
                    <strong>Data</strong>: {seminar.startDatetime}<br></br>
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
    </>
}