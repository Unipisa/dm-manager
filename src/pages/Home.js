import { useEngine } from '../Engine'
import models from '../models/Models'

export default function Home() {
  const engine = useEngine()
  const user = engine.user

  const modelElements = models
    .map(Model => [Model, Model.homeElement(user)])
    .filter(([Model, Element]) => Model !== null)

  return <>
      <p>{user.firstName}{user.roles && ` [${user.roles.join(', ')}]`}, puoi:</p>
      <ul>
      { modelElements.map(([Model, Element]) => 
      <li key={Model.code}>{Element}</li>) }
      { modelElements.length === 0 &&
          <li>Nulla. 
            Scrivi a <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a>
            per maggiori informazioni
          </li> }
      </ul>
  </>
  }
  
  