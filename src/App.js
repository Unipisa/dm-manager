import { BrowserRouter, Routes, Route } from 'react-router-dom'

import {useCreateEngine, EngineProvider} from './Engine'
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
import RoomLabelsPage from './components/RoomLabelsPage'
import { Container } from 'react-bootstrap'
import {QueryClient, QueryClientProvider } from 'react-query'

console.log("dm-manager (app starting)")

const queryClient = new QueryClient()

function Internal() {
  const engine = useCreateEngine()
  
  if (!engine.connected) {
    return <Connecting engine={engine}/>
  }
  
  if (!engine.loggedIn) {
    return <LoginPage engine={engine}/>
  }

  return <EngineProvider value={engine}>
     <BrowserRouter>
      <Header/>
      <Messages messages={ engine.messages } acknowledge={ () => engine.clearMessages() } />
      <Container>
        <Routes>  
          <Route path="/" element={<Home />} />
          <Route path="/roomLabels" element={<RoomLabelsPage />} />
          <Route path="/visits/:id" element={<VisitPage />} />
          <Route path="/visits" element={<VisitsPage />} />
          <Route path="/users/:id" element={<UserPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
     </BrowserRouter>    
    </EngineProvider>
}  

export default function App() {
  return <QueryClientProvider client={queryClient}>
    <Internal />
  </QueryClientProvider>    
}
