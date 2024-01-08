import { Card } from 'react-bootstrap'

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
            { /*(user.hasProcessPermission('/process/my/visits')) &&
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
                        <b>*** il servizio è in fase sperimentale ***</b>
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
            </div>*/            
            }
            { (user.hasProcessPermission('/process/roomLabel')) &&
            <div className="col-lg-6 p-3">
            <Card className="shadow">
                <Card.Header>                    
                    <div className="d-flex flex-row justify-content-between">
                        <strong>Cartellini stanze</strong>
                        <a href="/process/roomLabels"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                    </div>
                </Card.Header>
                <Card.Body>
                    <ul>
                        <li>gestisci richieste cartellini</li>
                    </ul>                    
                </Card.Body>
            </Card>
            </div>
            }
        </div>
    </>
  }
