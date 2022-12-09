import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { NavLink } from 'react-router-dom'
import { Container } from 'react-bootstrap'

import { useEngine } from '../Engine'
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
              <NavLink to="/" className="nav-link">Home</NavLink>
              <NavLink to="/roomLabel" className="nav-link">
                Cartellino Stanze</NavLink>
              {user.hasSomeRole('room-manager','room-supervisor','supervisor','admin') 
              && <NavLink to="/room" className="nav-link">
                Stanze</NavLink>}
              {user.hasSomeRole('visit-manager','visit-supervisor','supervisor','admin') 
              && <NavLink to="/visit" className="nav-link">
                Visitatori</NavLink>}
              {user.hasSomeRole('grant-manager','grant-supervisor','supervisor','admin') 
              && <NavLink to="/grant" className="nav-link">
                Grants</NavLink>}              
              {user.hasSomeRole('supervisor', 'admin', 'person-supervisor', 'person-manager')
              && <NavLink to="/person" className="nav-link">
                Persone</NavLink>}
              {user.hasSomeRole('supervisor','admin') 
                && <NavLink to="/user" className="nav-link">
                  Utenti</NavLink>}
              {user.hasSomeRole('supervisor','admin') 
                && <NavLink to="/token" className="nav-link">
                  Tokens</NavLink>}
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
  
  