import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { NavLink } from 'react-router-dom'
import { Container } from 'react-bootstrap'

import engine from '../engine'
import package_json from '../../package.json'

export default function Header({ user }) {
  return (
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="/">dm-manager { package_json.version }</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <NavLink to="/" className="nav-link">Home</NavLink>
              <NavLink to="/card" className="nav-link">Cartellino Stanze</NavLink>
              {user.hasSomeRole('visit-manager','visit-supervisor','supervisor','admin') && <NavLink to="/visits" className="nav-link">Visitatori</NavLink>}
              {user.hasSomeRole('supervisor','admin') && <NavLink to="/users" className="nav-link">Utenti</NavLink>}
              {user.hasSomeRole('supervisor','admin') && <NavLink to="/tokens" className="nav-link">Tokens</NavLink>}
              {/*<NavDropdown title="Dropdown" id="basic-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">
                  Another action
                </NavDropdown.Item>
                <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">
                  Separated link
                </NavDropdown.Item>
                </NavDropdown>
              */} 
            </Nav>
          </Navbar.Collapse>
          <Nav className="right">
            <NavDropdown title={ user ? user.username : "user"}>
                <NavDropdown.Item onClick={ () => engine.logout() }>logout</NavDropdown.Item>
                {user.hasSomeRole('disguised-admin') && <NavDropdown.Item onClick={ () => engine.impersonate_role('admin') }>ritorna admin</NavDropdown.Item>}
                {user.hasSomeRole('admin', 'disguised-admin') && ['supervisor', 'visit-manager', 'visit-supervisor'].map(role => <NavDropdown.Item key={role} onClick={ () => engine.impersonate_role(role) }>impersona {role}</NavDropdown.Item>)}
            </NavDropdown>
         </Nav>
        </Container>
      </Navbar>
    );
  }
  
  