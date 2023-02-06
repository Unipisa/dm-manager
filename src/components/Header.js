import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import { useEngine } from '../Engine'
import Models from '../models/Models'
import package_json from '../../package.json'

export default function Header() {
  const engine = useEngine()
  const user = engine.user
  const navigate = useNavigate()

  return (
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="/">{ engine.config.SERVER_NAME } { package_json.version }</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              { Object.values(Models)
                .filter(Model => Model.MenuElement !== null)
                .map(Model => <Model.MenuElement key={Model.code} Model={Model} user={user}/>)}
            </Nav>
          </Navbar.Collapse>
          <Nav className="right">
            <NavDropdown title={ user ? user.username : "user"}>
                <NavDropdown.Item onClick={ () => engine.logout() }>logout</NavDropdown.Item>
                {user.hasSomeRole('disguised-admin') && <NavDropdown.Item onClick={ () => engine.impersonate_role('admin') }>ritorna admin</NavDropdown.Item>}
                {user.hasSomeRole('admin', 'disguised-admin') && 
                  ['supervisor', 
                  'assignment-manager',
                  'assignment-supervisor',
                  'grant-manager',
                  'grant-supervisor',
                  'group-manager',
                  'group-supervisor',
                  'label-manager',
                  'person-manager',
                  'person-supervisor',
                  'room-manager',
                  'room-supervisor',
                  'staff-manager',
                  'staff-supervisor',
                  'visit-manager',
                  'visit-supervisor',
                  ].map(role => <NavDropdown.Item 
                    key={role} 
                    onClick={ async () => {
                      await engine.impersonate_role(role)
                      engine.addMessage(`devi ricaricare la pagina perché il nuovo ruolo venga assimilato`, 'warning')
                      // FIXME: la pagina non si aggiorna con i nuovi ruoli
                      navigate('/') // FIXME: non sembra funzionare
                    }}>impersona {role}</NavDropdown.Item>)}
                {}
            </NavDropdown>
         </Nav>
        </Container>
      </Navbar>
    );
  }
  
  