import { Link } from 'react-router-dom'

function is(user, role) {
  return user.roles.includes(role) || user.roles.includes('admin')
}

export default function Home({ user }) {
    return (<>
      <p>{user.firstName}, puoi:
        <ul>
          <li><Link to="/card">elaborare un cartellino con i nominativi per le stanze</Link></li>
          { is(user, "visit-manager") && 
            <li><Link to="/visits">gestire le visite</Link></li>
          }
          { is(user, "admin") &&
            <li><Link to="/users">gestire gli utenti</Link></li>
          }
          { is(user, "admin") &&
            <li><Link to="/tokens">gestire i token</Link></li>
          }
        </ul>
      </p>
      </>
    );
  }
  
  