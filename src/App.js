import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Button from 'react-bootstrap/Button'
import LoginPage from './components/LoginPage.js'
import { OAuth2Popup, OAuthPopup, useOAuth2 } from "@tasoskakour/react-use-oauth2"
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom"
import { useState, useEffect } from 'react'

import Api from './api'

function MyNavBar() {
  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="#home">dm-manager</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link href="#link">Link</Nav.Link>
            <NavDropdown title="Dropdown" id="basic-nav-dropdown">
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function Home({ api }) {
  const config = api.config
  const { data, loading, error, getAuth } = useOAuth2({
    authorizeUrl: config.AUTHORIZE_URL,
    clientId: config.CLIENT_ID,
    redirectUri: `${document.location.origin}/callback`,
    scope: "",
    responseType: "code",
    exchangeCodeForTokenServerURL: `${config.SERVER_URL}/token`,
    exchangeCodeForTokenMethod: "POST",
    onSuccess: (payload) => console.log("Success", payload),
    onError: (error_) => console.log("Error", error_)
  });

  const isLoggedIn = Boolean(data?.access_token); // or whatever...

  if (error) {
    return <div>Error</div>;
  }

  if (loading) {
    return <div>Loggin in...</div>;
  }

  if (isLoggedIn) {
    return <pre>{JSON.stringify(data)}</pre>;
  }

  return (<>
    <Button style={{ margin: "24px" }} type="button" onClick={() => getAuth()}>
      test oauth2
    </Button>
    <p>config: {`${JSON.stringify(config)}`}</p>
    </>
  );


}

function App() {
  const [ api, setApi ] = useState(null)
  const [ user, setUser ] = useState(null)
  const loggedIn = ( user !== null )
  const connected = ( api !== null )
  
  useEffect(() => {    (async () => {
        const api = new Api()
        await api.getConfig()
        setApi(api)        
    })().catch(console.error)
  }, [])

  if (!connected) {
    return <p>Connecting...</p>
  }

  if (!loggedIn) {
    return <LoginPage api={ api } setUser={ setUser }/>
  }

  return <div>
  <MyNavBar />
  <BrowserRouter>
    <Routes>  
      <Route element={<OAuthPopup />} path="/callback" />
      <Route element={<Home api={api} />} path="/" />
    </Routes>
  </BrowserRouter>
</div>
}

export default App;
