import { useEngine } from '../Engine'
import models from '../models/Models'

export default function Home() {
  const engine = useEngine()
  const user = engine.user

  return (<>
      <p>{user.firstName}{user.roles && ` [${user.roles.join(', ')}]`}, puoi:</p>
      <ul>
      { models.map(Model => 
          <li key={Model.code}>{ Model.homeElement(user) } </li>)}
      </ul>
      </>
    );
  }
  
  