import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState, useEffect } from 'react'

import LoginPage from './components/LoginPage'
import Header from './components/Header'
import Api from './api'

function Home({ api }) {
  const config = api.config

  return (<>
    <p>config: {`${JSON.stringify(config)}`}</p>
    </>
  );
}

function App() {
  const [ api, setApi ] = useState(null)
  const [ user, setUser ] = useState(null)
  var loggedIn = ( user !== null )
  const connected = ( api !== null )
  
  useEffect(() => {(async () => {
        console.log("dm-manager (app starting)")
        const api = new Api()
        await api.getConfig()
        setApi(api)

        // Get the login status of the user, unless already logged in
        //
        // We should probably provide a /login endpoint on the client that 
        // changes the state, so that we do not need this asynchronous hack.
        if (! loggedIn) {
            const user_response = await fetch('http://localhost:8000/login', {
                metod: 'GET',
                credentials: 'include'
            })
            const authuser = await user_response.json();
            setUser(authuser)
        }
    })().catch(console.error)
  }, [
    loggedIn
  ])

  if (! connected) {
    return <p>Connecting...</p>
  }

  if (! loggedIn) {
    return <LoginPage api={ api } setUser={ setUser }/>
  }

  function logout() {
    api.post("/logout")
    setUser(null)
  }

  return <div>
  <Header user={user} logout={logout}/>
  <BrowserRouter>
    <Routes>  
      <Route element={<Home api={api} />} path="/" />
    </Routes>
  </BrowserRouter>
</div>
}

export default App;
