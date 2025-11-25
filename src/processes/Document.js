import { useParams, useNavigate } from "react-router-dom"
import Loading from "../components/Loading"
import { useQuery } from "react-query"
import { Button, Card } from "react-bootstrap"

export default function Document() {
    const { id } = useParams()
    const navigate = useNavigate()

    const { isLoading, error, data } = useQuery([ 'document', id ])

    if (isLoading) return <Loading error={error}></Loading>
    if (error) return <div>{`${error}`}</div>

    const document = data.document
    const allowed = data.allowed

    return <div>
        <Card>
            <Card.Header>{document.name}</Card.Header>
            <Card.Body>
                <strong>Data</strong>: {document.date} <br></br>
                {document.description && <><strong>Descrizione</strong>: {document.description}</>}

                <div className="my-3"></div>
                { allowed && 
                <a className="btn btn-primary"
                    href={`/api/v0/document/${document._id}/download`}>
                    Download
                </a>}
                { !allowed && <div>Non hai il permesso di scaricare questo documento.</div>}
            </Card.Body>
        </Card>
    </div>
}