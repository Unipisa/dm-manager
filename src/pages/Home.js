import { useEngine } from '../Engine'
import Models from '../models/Models'

export default function Home() {
  const engine = useEngine()
  const user = engine.user

  const modelElements = Object.values(Models)
    .filter(Model => Model.HomeElement !== null)
    .map(Model => [Model, <Model.HomeElement Model={Model} user={user}/>])

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
  
  