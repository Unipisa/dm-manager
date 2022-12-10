import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { Container } from 'react-bootstrap'

import { useEngine } from '../Engine'
import models from '../models/Models'
import package_json from '../../package.json'

export default function Header() {
  const engine = useEngine()
  const user = engine.user

  return (
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="/">{ engine.config.SERVER_NAME } { package_json.version }</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              { models.map(Model => Model.menuElement(user))}
            </Nav>
          </Navbar.Collapse>
          <Nav className="right">
            <NavDropdown title={ user ? user.username : "user"}>
                <NavDropdown.Item onClick={ () => engine.logout() }>logout</NavDropdown.Item>
                {user.hasSomeRole('disguised-admin') && <NavDropdown.Item onClick={ () => engine.impersonate_role('admin') }>ritorna admin</NavDropdown.Item>}
                {user.hasSomeRole('admin', 'disguised-admin') && 
                  ['supervisor', 
                  'visit-manager', 
                  'visit-supervisor',
                  'room-manager',
                  'room-supervisor',
                  ].map(role => <NavDropdown.Item key={role} onClick={ () => engine.impersonate_role(role) }>impersona {role}</NavDropdown.Item>)}
                {}
            </NavDropdown>
         </Nav>
        </Container>
      </Navbar>
    );
  }
  
  