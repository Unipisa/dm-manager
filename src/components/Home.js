import { Link } from 'react-router-dom'
import { useEngine } from '../Engine'

export default function Home() {
  const engine = useEngine()
  const user = engine.user
  return (<>
      <p>{user.firstName} [{user.roles.join(', ')}], puoi:</p>
        <ul>
          <li><Link to="/roomLabels">elaborare un cartellino con i nominativi per le stanze</Link></li>
          { user.hasSomeRole('visit-manager','admin') && 
            <li><Link to="/visits">gestire i visitatori</Link></li>
          }
          { user.hasSomeRole('visit-supervisor','supervisor') && 
            <li><Link to="/visits">vedere i visitatori</Link></li>
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
  
  