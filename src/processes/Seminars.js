import { useQuery, useQueryClient } from 'react-query'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../api'

export default function ManageSeminars() {

    return (
        <SeminarList></SeminarList>
    )
}

function SeminarList() {
    const queryClient = useQueryClient()
    const { isLoading, error, data } = useQuery([ 'process', 'seminars' ])

    if (isLoading) {
        return "Loading"
    }

    if (error) {
        return "Error: " + error.message
    }

    const deleteSeminar = async (id) => {
        try {
            await api.del("/api/v0/process/seminars/" + id)
        }
        catch {
            console.log("Error while deleting the seminar")
        }
        
        queryClient.invalidateQueries([ 'process', 'seminars' ])
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
                        <button className="ms-2 btn btn-danger" onClick={() => deleteSeminar(seminar._id)}>
                            Delete
                        </button>
                        <Link className="ms-2" to={"/process/seminars/add/" + seminar._id}>
                            <button className="btn btn-primary">
                                Edit
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
        <a href="/process/seminars/add">
            <button className="btn btn-primary my-3">Nuovo seminario</button>
        </a>
        <div className="row">
            {seminar_block}
        </div>
    </>
}