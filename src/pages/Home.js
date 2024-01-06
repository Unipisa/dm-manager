import { Card } from 'react-bootstrap'

import { useEngine } from '../Engine'
// import Models from '../models/Models'

export default function Home() {
  const engine = useEngine()
  const user = engine.user
  /*
  let modelElements = []

  let items = modelElements.map(([Model, Element], i) =>
    <li key={i}>{Element}</li>)

  if (items.length === 0) items.push(<li>
          Nulla. 
          Scrivi a <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a>
          {} se questo ti sembra un errore.
    </li>)
    */
    const processes = <>
        {/*<h4>Processi disponibili</h4>*/}
        <div className="row">
            { (user.roles.includes('admin') || user.roles.includes('/api/v0/process/seminars')) &&
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
            { (user.roles.includes('admin') || user.roles.includes('/api/v0/process/visit')) &&
            <div className="col-lg-6 p-3">
                <Card className="shadow">
                    <Card.Header>                    
                        <div className="d-flex flex-row justify-content-between">
                            <strong>Visitatori</strong>
                            <a href="/process/visits"><button className="btn btn-sm btn-primary stretched-link">Inizia</button></a>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ul>
                            <li>Inserisci visitatore</li>
                            <li>Informazioni sui visiatori inseriti</li>
                        </ul>                        
                    </Card.Body>
                </Card>
            </div>            
            }
            { (user.roles.includes('admin') || user.roles.includes('/api/v0/process/roomLabel')) &&
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

  return <>
    {processes}
    <p>
        Puoi accedere al <a href="/profile">tuo profilo</a>.
        Per problemi o informazioni scrivi a <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a>.
        {} {user.roles.length>0 && `I tuoi permessi: ${user.roles.join(', ')}. `}
        {} {user.roles.length===0 && `Non risultano permessi assegnati al tuo utente.`}
    </p>
  </>
  }
  
  
