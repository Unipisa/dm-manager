import Button from 'react-bootstrap/Button'
import { OAuth2Popup, OAuthPopup, useOAuth2 } from "@tasoskakour/react-use-oauth2"
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom"
import { useState, useEffect } from 'react'

import LoginPage from './components/LoginPage'
import Header from './components/Header'
import Api from './api'

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
  <Header user={user} />
  <BrowserRouter>
    <Routes>  
      <Route element={<OAuthPopup />} path="/callback" />
      <Route element={<Home api={api} />} path="/" />
    </Routes>
  </BrowserRouter>
</div>
}

export default App;
