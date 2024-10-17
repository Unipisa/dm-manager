import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import api from '../api'
import { useEngine } from '../Engine'
import { ConfirmDeleteButton } from '../components/ModalDialog'

export default function ProcessUrls() {
    return  <>
        <h1 className="text-primary pb-0">Gestione alias pagine web</h1>
        <a href={`/process/my/urls/__new__`}>
            <button className="btn btn-primary my-3">Nuovo alias</button>
        </a>
        <UrlList/>
        <hr />
        <div>
        <i>Chi può accedere a questa pagina?</i><br />
        Questa pagina è accessibile a tutti gli utenti 
        con permesso <i>/process/my/urls</i>. Tale permesso è automatico 
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

function UrlList() {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')
    const { isLoading, error, data } = useQuery([ 'process', 'my', 'urls' ])
    const queryClient = useQueryClient()
    const addMessage = useEngine().addMessage

    if (isLoading) {
        return "Loading"
    }

    if (error) {
        return "Error: " + error.message
    }

    return <>
        {data.data.map(url=> <div className="p-3 col-lg-6 p-0" key={url._id}>
                <Card className="shadow">
                    <Card.Header className="h6">
                        <div className="d-flex d-row justify-content-between">
                            <div>Alias pagina web</div>
                            {isAdmin && <a href={`/url/${url._id}`}>{url._id}</a>}
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <strong>alias</strong>: {url.alias}<br />
                        <strong>destination</strong>: {url.destination}<br />
                        <strong>owner</strong>: {url.owner}<br />
                        <div className="mt-2 d-flex flex-row justify-content-end">                        
                            {
                            <ConfirmDeleteButton className="ms-2 btn btn-danger" objectName={`l'alias ${url.alias}`} onConfirm={() => removeUrl(url._id)}>
                                Elimina
                            </ConfirmDeleteButton>}
                            <Link className="ms-2" to={`${url._id}`}>
                                <button className="btn btn-primary">
                                    Modifica / Visualizza
                                </button>
                            </Link>
                        </div>
                    </Card.Body>                
                </Card>
            </div>)}
    </>

    async function removeUrl(id) {
        try {
            await api.del(`/api/v0/process/my/urls/${id}`)
            queryClient.invalidateQueries(`process/my/urls`.split('/'))
        } catch(e) {
            console.error(e)
            addMessage(`${e}`)
        }
    }
}