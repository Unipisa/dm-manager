import { Card } from 'react-bootstrap'
import { NavDropdown } from "react-bootstrap"
import { NavLink } from "react-router-dom"

import { useEngine } from '../Engine'

export default function Home() {
    const user = useEngine().user
    return <>
        <div className="row">
            { (user.hasProcessPermission('/process/seminars')) &&
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>                    
                        <div className="d-flex flex-row justify-content-between">
                            <strong>Seminari</strong>
                            <a href="/process/seminars"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Inserimento di nuovi seminari</li>
                            <li>Gestione dei seminari inseriti</li>
                        </ul>
                    </Card.Body>
                </Card>
            </div>            
            }
            { (user.hasProcessPermission('/process/conferences')) &&
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>                    
                        <div className="d-flex flex-row justify-content-between">
                            <strong>Convegni</strong>
                            <a href="/process/conferences"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Inserimento di nuovi convegni</li>
                            <li>Gestione dei convegni inseriti</li>
                        </ul>
                    </Card.Body>
                </Card>
            </div>            
            }
            { user.hasProcessPermission('/process/my/visits') && user.person &&
            // il ruolo '/process/my/visits' viene assegnato al volo
            // vedi: server/server.js
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>                    
                        <div className="d-flex flex-row justify-content-between">
                            <strong>I Miei Visitatori</strong>
                            <a href="/process/my/visits"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Inserisci un tuo visitatore</li>
                            <li>Informazioni sui tuoi visitatori inseriti</li>    
                        </ul>         
                    </Card.Body>
                </Card>
            </div>            
            }
            { (user.hasProcessPermission('/process/visits')) &&
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>                    
                        <div className="d-flex flex-row justify-content-between">
                            <strong>Gestione Visitatori</strong>
                            <a href="/process/visits"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Inserisci visitatore</li>
                            <li>Informazioni sui visitatori inseriti</li>
                            <li>Assegnazione stanza</li>
                        </ul>         
                    </Card.Body>
                </Card>
            </div> }
            { user.person &&  
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>                    
                        <div className="d-flex flex-row justify-content-between">
                            <strong>Elenco Visitatori</strong>
                            <a href="/process/visitsList"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Visualizza le informazioni sugli ultimi visitatori</li>
                        </ul>                    
                    </Card.Body>
                </Card>
            </div>
            }
            { user.hasProcessPermission('/process/changeRoom') &&
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>
                        <div className="d-flex flex-row justify-content-between">
                            <strong>Cambia stanza a una persona</strong>
                            <a href="/process/changeRoom"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Permette agli amministratori di cambiare la stanza assegnata a una persona</li>
                        </ul>
                    </Card.Body>
                </Card>
            </div>
            }
            { user.hasProcessPermission('/process/roomAssignmentsList') &&
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>                    
                        <div className="d-flex flex-row justify-content-between">
                            <strong>Elenco Assegnazioni Stanze</strong>
                            <a href="/process/roomAssignmentsList"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Visualizza le informazioni sulle assegnazioni delle stanze</li>
                        </ul>                    
                    </Card.Body>
                </Card>
            </div>
            }
            { user.hasProcessPermission('/process/roomLabels') &&
            <div className="col-lg-6 p-3">
            <Card className="shadow">
                <Card.Header>                    
                    <div className="d-flex flex-row justify-content-between">
                        <strong>Cartellini Stanze</strong>
                        <a href="/process/roomLabels"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                    </div>
                </Card.Header>
                <Card.Body>
                    <ul>
                        <li>Gestisci richieste cartellini</li>
                    </ul>                    
                </Card.Body>
            </Card>
            </div>
            }
            {
                user.hasProcessPermission('/process/my/urls') && 
                <div className='col-lg-6 p-3'>
                    <Card className="shadow">
                        <Card.Header>
                            <div className="d-flex flex-row justify-content-between">
                                <strong>Alias Pagine Web</strong>
                                <a href="/process/my/urls"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <ul>
                                <li>Gestisci gli alias delle pagine web personali</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </div>
            }
            { user.hasProcessPermission('/process/my/courses') && user.person &&
            // il ruolo '/process/my/courses' viene assegnato al volo
            // vedi: server/server.js
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>                    
                        <div className="d-flex flex-row justify-content-between">
                            <strong>I Miei Corsi di Dottorato</strong>
                            <a href="/process/my/courses"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Informazioni sui tuoi corsi di dottorato inseriti</li>
                            <li>Inserimento delle lezioni dei corsi</li>  
                        </ul>         
                    </Card.Body>
                </Card>
            </div>            
            }
            { (user.hasProcessPermission('/process/courses')) &&
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>                    
                        <div className="d-flex flex-row justify-content-between">
                            <strong>Corsi di Dottorato</strong>
                            <a href="/process/courses"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Inserimento corsi di dottorato</li>
                            <li>Gestione dei corsi inseriti</li>
                        </ul>
                    </Card.Body>
                </Card>
            </div>            
            }
        </div>
    </>
  }

// this menu is inserted in the Header component

export function ProcessDropdown() {
    const user = useEngine().user
    const items = []
    if (user.hasProcessPermission('/process/seminars')) items.push(
        <NavDropdown.Item key="seminars" as={NavLink} to="/process/seminars">
            Seminari
        </NavDropdown.Item>)
    if (user.hasProcessPermission('/process/conferences')) items.push(
        <NavDropdown.Item key="conferences" as={NavLink} to="/process/conferences">
            Convegni
        </NavDropdown.Item>)        
    if (user.hasProcessPermission('/process/my/visits') && user.person) items.push(
        <NavDropdown.Item key="my/visits" as={NavLink} to="/process/my/visits">
            Miei Visitatori
        </NavDropdown.Item>)
    if (user.hasProcessPermission('/process/visits')) items.push(
        <NavDropdown.Item key="visits" as={NavLink} to="/process/visits">
            Gestione Visitatori
        </NavDropdown.Item>)
    if (user.person) items.push(
        <NavDropdown.Item key="visitsList" as={NavLink} to="/process/visitsList">
            Elenco Visitatori
        </NavDropdown.Item>)
    if (false && user.hasProcessPermission('/process/changeRoom')) items.push(
        <NavDropdown.Item key="changeRoom" as={NavLink} to="/process/changeRoom">
            Cambia Stanza
        </NavDropdown.Item>)
    if (user.hasProcessPermission('/process/roomLabels')) items.push(
        <NavDropdown.Item key="roomLabels" as={NavLink} to="/process/roomLabels">
            Cartellini Stanze
        </NavDropdown.Item>)
    if (user.hasProcessPermission('/process/roomAssignmentsList')) items.push(
        <NavDropdown.Item key="roomAssignmentsList" as={NavLink} to="/process/roomAssignmentsList">
            Assegnazioni Stanze
        </NavDropdown.Item>)
    if (user.hasProcessPermission('/process/my/urls')) items.push(
        <NavDropdown.Item key="urls" as={NavLink} to="/process/my/urls">
            Alias Pagine Web
        </NavDropdown.Item>)
    if (user.hasProcessPermission('/process/courses')) items.push(
        <NavDropdown.Item key="courses" as={NavLink} to="/process/courses">
            Corsi di Dottorato
        </NavDropdown.Item>)       
    if (items.length === 0) return null

    return <NavDropdown className="mx-2 py-2" title="Processi">
        {items}
    </NavDropdown>
}
