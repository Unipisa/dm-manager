import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { NavLink } from 'react-router-dom'

import engine from '../engine'
import package_json from '../../package.json'

export default function Header({ user }) {
  return (
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href="/">dm-manager { package_json.version }</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <NavLink to="/" className="nav-link">Home</NavLink>
              {user.hasRole('visit-manager') && <NavLink to="/visits" className="nav-link">Visitatori</NavLink>}
              {user.hasRole('admin') && <NavLink to="/users" className="nav-link">Utenti</NavLink>}
              {user.hasRole('admin') && <NavLink to="/tokens" className="nav-link">Tokens</NavLink>}
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
            </NavDropdown>
         </Nav>
        </Container>
      </Navbar>
    );
  }
  
  