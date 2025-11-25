import { Nav, Navbar, NavDropdown } from "react-bootstrap"
import { NavLink } from "react-router-dom"
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import { useEngine } from '../Engine'
import package_json from '../../package.json'
import { ProcessDropdown } from '../processes/Home'

export default function Header() {
  const engine = useEngine()
  const user = engine.user
  const navigate = useNavigate()

  return (
      <Navbar bg="light" expand="lg" className="mb-0 mr-4 shadow border-primary border-bottom border-3" variant="pills">
        <Container>
          <Navbar.Brand href="/">
            <div className="small text-end"><strong>{ engine.config.SERVER_NAME }</strong></div>
            <div className="text-muted text-end small">Release { package_json.version }</div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <ProcessDropdown />
            { user && user.roles.includes('admin') && <AdminDropdown /> }
          </Navbar.Collapse>
          <Nav className="right">
            <NavDropdown title={ user ? (<span className="me-2">{user.firstName} {user.lastName}<br />{user.username}</span>) : "user"}>
                <NavDropdown.Item onClick={ () => navigate('/profile') }>il mio profilo</NavDropdown.Item>
                <NavDropdown.Item onClick={ () => engine.logout() }>logout</NavDropdown.Item>
                {user.hasSomeRole('disguised-admin') && <NavDropdown.Item onClick={ () => engine.impersonate_role('admin') }>ritorna admin</NavDropdown.Item>}
                {user.hasSomeRole('admin', 'disguised-admin') && 
                  [
                  '', // nessun ruolo
                  '/process/roomLabel',
                  '/process/visit',
                  'notify/process/visit',
                  'notify/portineria',
                  'notify/admin',
                  'supervisor', 
                  'visit-supervisor',
                  ].map(role => <NavDropdown.Item 
                    key={role} 
                    onClick={ async () => {
                      await engine.impersonate_role(role)
                      engine.addMessage(`devi ricaricare la pagina perché il nuovo ruolo venga assimilato`, 'warning')
                      // FIXME: la pagina non si aggiorna con i nuovi ruoli
                      navigate('/') // FIXME: non sembra funzionare
                    }}>impersona {role || 'utente senza ruoli'}</NavDropdown.Item>)}
                {}
            </NavDropdown>
         </Nav>
        </Container>
      </Navbar>
    );
  }
  
  function AdminDropdown() {
    return <>
      <NavDropdown title="Personale" className="mx-2 py-2">
        <NavDropdown.Item as={NavLink} to="/person">Anagrafica</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/document">Documenti</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/group">Gruppi</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/staff">Qualifiche</NavDropdown.Item>
      </NavDropdown>
      <NavDropdown title="Ricerca" className="mx-2 py-2">
        <NavDropdown.Item as={NavLink} to="/grant">Grants</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/thesis">Tesi Dottorato</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/visit">Visite</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/institution">Affiliazioni</NavDropdown.Item>
      </NavDropdown>
      <NavDropdown title="Eventi" className="mx-2 py-2">
        <NavDropdown.Item as={NavLink} to="/event-seminar">Seminari</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/event-conference">Eventi</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/event-phd-course">Corsi di Dottorato</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/seminar-category">Cicli di seminari</NavDropdown.Item>
      </NavDropdown>
      <NavDropdown title="Stanze" className="mx-2 py-2">
        <NavDropdown.Item as={NavLink} to="/room">Stanze</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/conference-room">Aule</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/roomAssignment">Assegnazione</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/roomLabel">Cartellini</NavDropdown.Item>
      </NavDropdown>
      <NavDropdown title="Amministrazione" className="mx-2 py-2"> 
        <NavDropdown.Item as={NavLink} to="/user">Utenti</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/url">Urls</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/token">Tokens</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/log">Logs</NavDropdown.Item>
        <NavDropdown.Item as={NavLink} to="/process/sanityCheck">Controlli di consistenza</NavDropdown.Item>
      </NavDropdown>
      <NavLink to="/form" className="nav-link">
        Moduli
      </NavLink>
    </>
  }