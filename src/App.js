import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import LoginPage from './components/LoginPage.js'
import { OAuth2Popup, OAuthPopup, useOAuth2 } from "@tasoskakour/react-use-oauth2";
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";


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

function Home() {
  const { data, loading, error, getAuth } = useOAuth2({
    authorizeUrl: "https://iam.unipi.it/oauth2/authorize",
    clientId: "R1K1DyQmplAQJHW77jO4WHMvnuca",
    redirectUri: `${document.location.origin}/callback`,
    scope: "",
    responseType: "code",
    exchangeCodeForTokenServerURL: "http://localhost:8000/token",
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

  return (
    <Button style={{ margin: "24px" }} type="button" onClick={() => getAuth()}>
      test oauth2
    </Button>
  );


}

function App() {
  const logged_in = false
  
  function login(email, password) {
    console.log(`email: ${ email }, password: ${ password }`)
  }

  if (!logged_in) {
    return <LoginPage callback={ login }/>
  }
  return <div>
  <MyNavBar />
  <BrowserRouter>
    <Routes>  
      <Route element={<OAuthPopup />} path="/callback" />
      <Route element={<Home />} path="/" />
    </Routes>
  </BrowserRouter>
</div>
}

export default App;
