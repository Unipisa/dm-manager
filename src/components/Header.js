import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import ModelNavDropdownElement from './ModelNavDropdownElement'

import { useEngine } from '../Engine'
import Models from '../models/Models'
import package_json from '../../package.json'

export default function Header() {
  const engine = useEngine()
  const user = engine.user
  const navigate = useNavigate()

  const objectCategories = [...new Set(Object.values(Models).filter(
    Model => Model.MenuElement !== null && Model.ModelCategory !== null && (user.hasSomeRole(...Model.schema.supervisorRoles))
  ).map(
    Model => Model.ModelCategory
  )) ].sort()

  return (
      <Navbar bg="light" expand="lg" className="mb-0 mr-4 shadow border-primary border-bottom border-3" variant="pills">
        <Container>
          <Navbar.Brand href="/">
            <div className="small text-end"><strong>{ engine.config.SERVER_NAME }</strong></div>
            <div className="text-muted text-end small">Release { package_json.version }</div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {objectCategories.map(Category => <NavDropdown title={Category.charAt(0).toUpperCase() + Category.slice(1)} key={Category} className="mx-2 py-2">
              { Object.values(Models).filter(
                  Model => Model.MenuElement !== null && Model.ModelCategory === Category
                ).sort(
                  (ModelA, ModelB) => ModelA.articulation['oggetti'] < ModelB.articulation['oggetti'] ? -1 : 1
                ).map(
                  Model => <ModelNavDropdownElement key={Model.code} Model={Model} user={user}/>
                )
              }
            </NavDropdown>)}
            <Nav className="me-auto">
              { Object.values(Models)
                .filter(Model => Model.MenuElement !== null && Model.ModelCategory === null)
                .map(Model => <Model.MenuElement key={Model.code} Model={Model} user={user}/>)}
            </Nav>
          </Navbar.Collapse>
          <Nav className="right">
            <NavDropdown title={ user ? (<span className="me-2">{user.firstName} {user.lastName}<br />{user.username}</span>) : "user"}>
                <NavDropdown.Item onClick={ () => engine.logout() }>logout</NavDropdown.Item>
                {user.hasSomeRole('disguised-admin') && <NavDropdown.Item onClick={ () => engine.impersonate_role('admin') }>ritorna admin</NavDropdown.Item>}
                {user.hasSomeRole('admin', 'disguised-admin') && 
                  [
                  '', // nessun ruolo
                  'supervisor', 
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
                    }}>impersona {role || 'utente senza ruoli'}</NavDropdown.Item>)}
                {}
            </NavDropdown>
         </Nav>
        </Container>
      </Navbar>
    );
  }
  
  