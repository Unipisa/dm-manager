import { BrowserRouter, Routes, Route } from 'react-router-dom'

import useEngine from './Engine'
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
  
  if (! engine.connected()) {
    return <Connecting engine={ engine } />
  }

  if (! engine.loggedIn()) {
    return <LoginPage engine={ engine } />
  }

  return <div>
  <BrowserRouter>
    <Header engine={engine} />
    <Messages engine={engine} />
    <Routes>  
      <Route path="/" element={<Home engine={engine} />} />
      <Route path="/visits/:id" element={<VisitPage engine={engine} />} />
      <Route path="/visits" element={<VisitsPage engine={engine} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
</div>
}
