import { Link } from 'react-router-dom'
import { useEngine } from '../Engine'

export default function Home() {
  const engine = useEngine()
  const user = engine.user

  return (<>
      <p>{user.firstName}{user.roles && ` [${user.roles.join(', ')}]`}, puoi:</p>
        <ul>
          <li><Link to="/labels">elaborare un cartellino con i nominativi per le stanze</Link></li>
          { user.hasSomeRole('room-manager','admin') && 
            <li><Link to="/rooms">gestire le stanze</Link></li>
          }
          { user.hasSomeRole('room-supervisor','supervisor') && 
            <li><Link to="/rooms">vedere le stanze</Link></li>
          }
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
      </>
    );
  }
  
  