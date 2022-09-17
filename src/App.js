import { BrowserRouter, Routes, Route } from 'react-router-dom'

import useEngine from './Engine'
import useApi from './Api'
import Connecting from './components/Connecting'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import VisitsPage from './components/VisitsPage'
import VisitPage from './components/VisitPage'
import NotFound from './components/NotFound'
import Home from './components/Home'
import Messages from './components/Messages'

console.log("dm-manager (app starting)")

export default function App() {
  const engine = useEngine()
  const api = useApi()
  
  if (! api.connected()) {
    return <Connecting api={ api }/>
  }

  if (! api.loggedIn()) {
    return <LoginPage api={ api }/>
  }

  return <div>
  <BrowserRouter>
    <Header api={api}/>
    <Messages engine={engine} />
    <Routes>  
      <Route path="/" element={<Home api={api} />} />
      <Route path="/visits/:id" element={<VisitPage engine={engine} api={api} />} />
      <Route path="/visits" element={<VisitsPage engine={engine} api={api}/>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
</div>
}
