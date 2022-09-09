import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState, useEffect } from 'react'

import Connecting from './components/Connecting'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import { getApi } from './api'

console.log("dm-manager (app starting)")

function Home({ api }) {
  const config = api.config

  return (<>
    <p>config: {`${JSON.stringify(config)}`}</p>
    </>
  );
}

function App() {
  const [api, setApi] = useState(getApi())
  
  if (! api.connected()) {
    return <Connecting api={ api } setApi={ setApi } />
  }

  if (! api.loggedIn()) {
    return <LoginPage api={ api } setApi={ setApi } />
  }

  return <div>
  <Header api={api} setApi={setApi} />
  <BrowserRouter>
    <Routes>  
      <Route element={<Home api={api} />} path="/" />
    </Routes>
  </BrowserRouter>
</div>
}

export default App;
