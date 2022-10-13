import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import engine from './engine'
import Connecting from './components/Connecting'
import Messages from './components/Messages'
import NotFound from './components/NotFound'
import Header from './components/Header'
import LoginPage from './components/LoginPage'
import Home from './components/Home'
import VisitsPage from './components/VisitsPage'
import VisitPage from './components/VisitPage'
import UsersPage from './components/UsersPage'
import UserPage from './components/UserPage'
import TokensPage from './components/TokensPage'

console.log("dm-manager (app starting)")

export default function App() {
  engine.sync(useState(engine.state))
  
  if (! engine.connected()) {
    return <Connecting />
  }

  if (! engine.loggedIn()) {
    return <LoginPage />
  }

  return <div>
  <BrowserRouter>
    <Header user = { engine.user() }/>
    <Messages messages={ engine.messages() } acknowledge={ () => engine.clearMessages() } />
    <Routes>  
      <Route path="/" element={<Home user={ engine.user() } />} />
      <Route path="/visits/:id" element={<VisitPage />} />
      <Route path="/visits" element={<VisitsPage />} />
      <Route path="/users/:id" element={<UserPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/tokens" element={<TokensPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
</div>
}
