import { Link } from 'react-router-dom'
import { useEngine } from '../Engine'

export default function Home() {
  const engine = useEngine()
  const user = engine.user

  return (<>
      <p>{user.firstName}{user.roles && ` [${user.roles.join(', ')}]`}, puoi:</p>
        <ul>
          <li><Link to="/roomLabel">elaborare un cartellino con i nominativi per le stanze</Link></li>
          { user.hasSomeRole('room-manager','admin') && 
            <li><Link to="/room">gestire le stanze</Link></li>
          }
          { user.hasSomeRole('room-supervisor','supervisor') && 
            <li><Link to="/room">vedere le stanze</Link></li>
          }
          { user.hasSomeRole('visit-manager','admin') && 
            <li><Link to="/visit">gestire i visitatori</Link></li>
          }
          { user.hasSomeRole('visit-supervisor','supervisor') && 
            <li><Link to="/visit">vedere i visitatori</Link></li>
          }
          { user.hasSomeRole('grant-manager','admin') && 
            <li><Link to="/grant">gestire i grants</Link></li>
          }
          { user.hasSomeRole('grant-supervisor','supervisor') && 
            <li><Link to="/grant">vedere i visitatori</Link></li>
          }
          { user.hasSomeRole('person-manager', 'admin') &&
            <li><Link to="/person">gestire l'elenco delle persone</Link></li>
          }
          { user.hasSomeRole('person-supervisor', 'supervisor') &&
            <li><Link to="/person">visualizzare l'elenco delle persone</Link></li>
          }
          { user.hasSomeRole('admin') &&
            <li><Link to="/user">gestire gli utenti</Link></li>
          }
          { user.hasSomeRole('supervisor') &&
            <li><Link to="/user">vedere gli utenti</Link></li>
          }
          { user.hasSomeRole('admin') &&
            <li><Link to="/token">gestire i token</Link></li>
          }
        </ul>
      </>
    );
  }
  
  