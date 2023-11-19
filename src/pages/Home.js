import { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import { Navigate } from 'react-router-dom'

import { useEngine } from '../Engine'
import Models from '../models/Models'

export default function Home() {
  const engine = useEngine()
  const user = engine.user

  const [redirectAfterLogin, setRedirectAfterLogin] = useState()
  useEffect(() => {
        const url = sessionStorage.getItem("redirect_after_login")
        console.log(`Home: redirect_after_login=${url}`)
        if (url && url !== redirectAfterLogin) setRedirectAfterLogin(url)
  }, [redirectAfterLogin])

  if (redirectAfterLogin) {
      console.log(`Home: redirecting to ${redirectAfterLogin}`)
      sessionStorage.removeItem("redirect_after_login")
      setRedirectAfterLogin(null)
      return <Navigate to={redirectAfterLogin} />
  }
  
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
          {/* spacer */} se questo ti sembra un errore.
    </li>)

    const processes = <>
        <h4>Processi disponibili</h4>
        <div className="row">
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
            { (user.roles.includes('admin') || user.roles.includes('/process/roomLabel')) &&
            <Card className="shadow">
                <Card.Header>                    
                    <div className="d-flex flex-row justify-content-between">
                        <strong>Cartellini stanze</strong>
                        <a href="/process/roomLabels"><button className="btn btn-sm btn-primary">Inizia</button></a>
                    </div>
                </Card.Header>
                <Card.Body>
                    <ul>
                        <li>Stampa cartellini richiesti</li>
                    </ul>                    
                </Card.Body>
            </Card>
            }
            </div>
        </div>
    </>

  return <>
    {processes}
    <h4>Altre azioni</h4>
      <p>{user.firstName}{user.roles && ` [${user.roles.join(', ')}]`}, 
        puoi:
      </p>
      <ul>
      { items }
      </ul>
  </>
  }
  
  
