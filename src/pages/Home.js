import { useEngine } from '../Engine'
import Models from '../models/Models'

export default function Home() {
  const engine = useEngine()
  const user = engine.user

  const modelElements = Object.values(Models)
    .map(Model => [Model, Model.homeElement(user)])
    .filter(([Model, Element]) => Element !== null)

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
  
  