import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Button } from 'react-bootstrap'
import { useState } from 'react'

import { useApi } from './api'
import Connecting from './components/Connecting'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import VisitsPage from './components/VisitsPage'
import VisitPage from './components/VisitPage'
import NotFound from './components/NotFound'
import Click from './components/Click'
import Home from './components/Home'

console.log("dm-manager (app starting)")

export default function App() {
  const api = useApi()
  
  if (! api.connected()) {
    return <Connecting api={ api } />
  }

  if (! api.loggedIn()) {
    return <LoginPage api={ api } />
  }

  return <div>
  <BrowserRouter>
    <Header api={api} />
    <Routes>  
      <Route path="/" element={<Home api={api} />} />
      <Route path="/visits/:id" element={<VisitPage api={api} />} />
      <Route path="/visits" element={<VisitsPage api={api} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
  <p>footer</p>
  <Click api={api} />
</div>
}
