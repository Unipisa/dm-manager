import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import {useEngine, EngineProvider} from './Engine'
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
import CardPage from './components/CardPage'
import { Container } from 'react-bootstrap'
import {QueryClient, QueryClientProvider } from 'react-query'

console.log("dm-manager (app starting)")

const queryClient = new QueryClient()

export default function App() {
  const engine = useEngine()

  if (!engine.connected) {
    return <Connecting engine={engine}/>
  }

  if (!engine.loggedIn) {
    return <LoginPage engine={engine}/>
  }

  return <EngineProvider value={engine}>
    <QueryClientProvider client={queryClient}>
     <BrowserRouter>
      <Header user = { engine.user() }/>
      <Messages messages={ engine.messages() } acknowledge={ () => engine.clearMessages() } />
      <Container>
        <Routes>  
          <Route path="/" element={<Home user={ engine.user() } />} />
          <Route path="/visits/:id" element={<VisitPage />} />
          <Route path="/visits" element={<VisitsPage />} />
          <Route path="/users/:id" element={<UserPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/card" element={<CardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
     </BrowserRouter>    
    </QueryClientProvider>    
  </EngineProvider>
}
