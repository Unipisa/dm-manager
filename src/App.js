import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';

import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import {useCreateEngine, EngineProvider} from './Engine'
import Connecting from './components/Connecting'
import Messages from './components/Messages'
import NotFound from './components/NotFound'
import Header from './components/Header'

import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import Models from './models/Models'
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
      <Container className="p-5">
        <Routes>  
          <Route path="/" element={<Home />} />
          {  Object.values(Models).map(x => x.routers()) }
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
