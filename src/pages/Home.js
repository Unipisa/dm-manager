import { Link } from 'react-router-dom'
import { PersonInput } from '../components/Input';
import { useEngine } from '../Engine'
import { useState } from 'react';

export default function Home() {
  const engine = useEngine()
  const user = engine.user

  const [obj, setObj] = useState({
    person: null
  })

  return (<>
      <p>{user.firstName}{user.roles && ` [${user.roles.join(', ')}]`}, puoi:</p>
        <ul>
          <li><Link to="/roomLabels">elaborare un cartellino con i nominativi per le stanze</Link></li>
          { user.hasSomeRole('visit-manager','admin') && 
            <li><Link to="/visits">gestire i visitatori</Link></li>
          }
          { user.hasSomeRole('visit-supervisor','supervisor') && 
            <li><Link to="/visits">vedere i visitatori</Link></li>
          }
          { user.hasSomeRole('grant-manager','admin') && 
            <li><Link to="/grants">gestire i grants</Link></li>
          }
          { user.hasSomeRole('grant-supervisor','supervisor') && 
            <li><Link to="/grants">vedere i visitatori</Link></li>
          }
          { user.hasSomeRole('person-manager', 'admin') &&
            <li><Link to="/persons">gestire l'elenco delle persone</Link></li>
          }
          { user.hasSomeRole('person-supervisor', 'supervisor') &&
            <li><Link to="/persons">visualizzare l'elenco delle persone</Link></li>
          }
          { user.hasSomeRole('admin') &&
            <li><Link to="/users">gestire gli utenti</Link></li>
          }
          { user.hasSomeRole('supervisor') &&
            <li><Link to="/users">vedere gli utenti</Link></li>
          }
          { user.hasSomeRole('admin') &&
            <li><Link to="/tokens">gestire i token</Link></li>
          }
        </ul>
        <PersonInput name="person" label="Persona" value={obj} setStore={setObj} edit={true}></PersonInput>
      </>
    );
  }
  
  