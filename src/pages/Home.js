import { Card } from 'react-bootstrap'

import { useEngine } from '../Engine'
// import Models from '../models/Models'

export default function Home() {
  const engine = useEngine()
  const user = engine.user
  /*
  let modelElements = []
  Object.values(Models).forEach(Model => {
      Model.homeElements(user).forEach(
        Element => modelElements.push([Model, Element])
      )
  })

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
                            <a href="/process/seminars"><button className="btn btn-sm btn-primary">Inizia</button></a>
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
            { (user.roles.includes('admin') || user.roles.includes('/api/v0/process/roomLabel')) &&
            <div className="col-lg-6 p-3">
            <Card className="shadow">
                <Card.Header>                    
                    <div className="d-flex flex-row justify-content-between">
                        <strong>Cartellini stanze</strong>
                        <a href="/process/roomLabels"><button className="btn btn-sm btn-primary">Inizia</button></a>
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
    {/*
    <h4>Altre azioni</h4>
      <p>{user.firstName}{user.roles && ` [${user.roles.join(', ')}]`}, 
        puoi:
      </p>
      <ul>
      { items }
      </ul>
        */}
    <p>
        Puoi accedere al <a href="/profile">tuo profilo</a>.
        Per problemi o informazioni scrivi a <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a>.
        {user.roles.length>0 && `I tuoi permessi: ${user.roles.join(', ')}. `}
        {user.roles.length===0 && `Non risultano permessi assegnati al tuo utente.`}
    </p>
  </>
  }
  
  
