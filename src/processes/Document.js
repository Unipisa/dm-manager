import { useParams } from "react-router-dom"
import Loading from "../components/Loading"
import { useQuery } from "react-query"
import { Card } from "react-bootstrap"

export default function Document() {
    const { id } = useParams()

    const { isLoading, error, data } = useQuery([ 'document', id, 'details' ])

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
                { allowed && <AttachmentList attachments={document.attachments} /> }                
                { !allowed && <div>Non hai il permesso di scaricare questo documento.</div>}
            </Card.Body>
        </Card>
    </div>
}

function AttachmentList({ attachments }) {
    return <ul>
        {attachments.map(att => (
            <li key={att._id}>
                <a href={`/api/v0/upload/${att._id}`}>{att.filename}</a>
            </li>
        ))}
    </ul>
}