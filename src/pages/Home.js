import { useEffect, useState } from 'react'
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
        setRedirectAfterLogin(url)
  }, [])

  if (redirectAfterLogin) {
      console.log(`Home: redirecting to ${redirectAfterLogin}`)
      sessionStorage.removeItem("redirect_after_login")
      return <Navigate to={redirectAfterLogin} />
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
  
  