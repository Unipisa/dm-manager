import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import {useCreateEngine, EngineProvider} from './Engine'
import Connecting from './components/Connecting'
import Messages from './components/Messages'
import NotFound from './components/NotFound'
import Header from './components/Header'

import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RoomLabelsPage from './pages/RoomLabelsPage'
import RoomPage from './pages/RoomPage'
import RoomsPage from './pages/RoomsPage'
import RoomAssignmentPage from './pages/RoomAssignmentPage'
import RoomAssignmentsPage from './pages/RoomAssignmentsPage'
import VisitsPage from './pages/VisitsPage'
import VisitPage from './pages/VisitPage'
import GrantsPage from './pages/GrantsPage'
import GrantPage from './pages/GrantPage'
import PersonsPage from './pages/PersonsPage'
import PersonPage from './pages/PersonPage'
import UsersPage from './pages/UsersPage'
import UserPage from './pages/UserPage'
import TokensPage from './pages/TokensPage'
import { Container } from 'react-bootstrap'
import {QueryClient, QueryClientProvider } from 'react-query'


console.log("dm-manager (app starting)")

const queryClient = new QueryClient()

function Internal() {
  const engine = useCreateEngine()
  
  if (! engine.connected) {
    return <Connecting engine={engine}/>
  }
  
  if (! engine.loggedIn) {
    console.log("user is not logged in");
    return <LoginPage engine={engine}/>
  }

  return <EngineProvider value={engine}>
     <BrowserRouter>
      <Header/>
      <Messages messages={ engine.messages } acknowledge={ () => engine.clearMessages() } />
      <Container>
        <Routes>  
          <Route path="/" element={<Home />} />
          <Route path="/labels" element={<RoomLabelsPage />} />
          <Route path="/rooms/:id" element={<RoomPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/assignments/:id" element={<RoomAssignmentPage />} />
          <Route path="/assignments" element={<RoomAssignmentsPage />} />
          <Route path="/visits/:id" element={<VisitPage />} />
          <Route path="/visits" element={<VisitsPage />} />
          <Route path="/grants/:id" element={<GrantPage />} />
          <Route path="/grants" element={<GrantsPage />} />
          <Route path="/persons/:id" element={<PersonPage />} />
          <Route path="/persons" element={<PersonsPage />} />
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
