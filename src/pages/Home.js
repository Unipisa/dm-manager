import { Navigate } from 'react-router-dom'

import { useEngine } from '../Engine'
import Models from '../models/Models'

export default function Home() {
  const engine = useEngine()
  const user = engine.user

  const redirect_after_login = sessionStorage.getItem("redirect_after_login")
  if (redirect_after_login) {
      sessionStorage.removeItem("redirect_after_login")
      //sessionStorage.setItem("redirect_after_login", 'fatto')
      return <Navigate to={redirect_after_login} />
  }
  

  const modelElements = Object.values(Models)
    .filter(Model => Model.HomeElement !== null)
    .map(Model => [Model, Model.HomeElement({Model, user})])
    .filter(([Model, Element]) => Element)

  let items = modelElements.map(([Model, Element]) =>
    <li key={Model.code}>{Element}</li>)

  if (items.length === 0) items.push(<li>
          Nulla. 
          Scrivi a <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a>
          se questo ti sembra un errore.
    </li>)

  return <>
      <p>{user.firstName}{user.roles && ` [${user.roles.join(', ')}]`}, 
        puoi:
      </p>
      <ul>
      { items }
      </ul>
  </>
  }
  
  