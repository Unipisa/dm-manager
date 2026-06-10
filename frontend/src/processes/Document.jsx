import { useParams } from "react-router-dom"
import Loading from "../components/Loading"
import { useQuery } from "react-query"
import { Card, Button } from "react-bootstrap"
import { formatDate } from '../components/DatetimeInput'
import Markdown from 'react-markdown'
import { useEngine } from '../Engine'

export default function Document() {
    const { id } = useParams()
    const engine = useEngine()

    const { isLoading, error, data } = useQuery([ 'document', id, 'details' ])

    if (isLoading) return <Loading error={error}></Loading>
    if (error) return <div>{`${error}`}</div>

    const document = data.document
    const allowed = data.allowed

    return <div>
        <Card>
            <Card.Header><h4>{document.name}</h4></Card.Header>
            <Card.Body>
                {document.description && <Markdown>
                    {"##### Descrizione del documento\n\n" + document.description}
                </Markdown>}

                <div className="my-3"></div>
                <strong>Data</strong>: {formatDate(document.date, false)} <br />
                
                {allowed && <AttachmentList attachments={document.attachments} />}
                
                {!allowed && !engine.loggedIn && (
                    <div className="alert alert-info mt-3">
                        <p>Questo documento richiede l'autenticazione.</p>
                        <Button variant="primary" onClick={() => window.location.href = '/'}>
                            Accedi per visualizzare
                        </Button>
                    </div>
                )}
                
                {!allowed && engine.loggedIn && (
                    <div className="alert alert-warning mt-3">
                        Non hai il permesso di accedere a questo documento.
                    </div>
                )}
            </Card.Body>
        </Card>
    </div>
}

function AttachmentList({ attachments }) {
    return <>
        <strong>Allegati:</strong>
        <ul>
            {attachments.map(att => (
                <li key={att._id}>
                    <a href={`/api/v0/upload/${att._id}`}>{att.filename}</a>
                </li>
            ))}
        </ul>
    </>
}