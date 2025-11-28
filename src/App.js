import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';

import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import axios from 'axios'

import {useCreateEngine, EngineProvider} from './Engine'
import Connecting from './components/Connecting'
import Messages from './components/Messages'
import NotFound from './components/NotFound'
import Header from './components/Header'

import Home from './pages/Home'
import Profile from './pages/Profile'
import LoginPage from './pages/LoginPage'
import Map from './pages/Map'
import Models from './models/Models'
import { Container } from 'react-bootstrap'
import {QueryClient, QueryClientProvider } from 'react-query'
import FormFillPage from './pages/FormFillPage'

// Processes
import AddSeminar from './processes/Seminar'
import AddConference from './processes/Conference'
import ManageSeminars from './processes/Seminars'
import ManageConferences from './processes/Conferences'
import ProcessVisits from './processes/Visits'
import ProcessVisit from './processes/Visit'
import ProcessVisitsList from './processes/VisitsList'
import ProcessRoomAssignmentsList from './processes/RoomAssignmentsList'
import ManageRoomLabels from './processes/RoomLabels'
import SanityCheck from './processes/SanityCheck'
import ProcessUrls from './processes/Urls'
import ProcessUrl from './processes/Url'
import ChangeRoom from './processes/ChangeRoom'
import AddCourse from './processes/Course'
import ManageCourses from './processes/Courses'
import Document from './processes/Document'

const BASE_URL = process.env.REACT_APP_SERVER_URL || ""

console.log("dm-manager (app starting)")

const queryClient = new QueryClient({
  defaultOptions: {
      queries: {
          queryFn: async ({queryKey}) => {
              let url = BASE_URL + '/api/v0'
              let params = {}
              for (const key of queryKey) {
                  if (typeof key === 'object') {
                      params = key
                      break
                  }
                  url += '/' + key
              }
              const out = await axios.get(url, {params})
              return out.data
          },
        keepPreviousData: true,
      }
  }
})

function Internal() {
  const engine = useCreateEngine()
  
  if (! engine.connected) {
    return <Connecting engine={engine}/>
  }
  
  if (! engine.loggedIn) {
    // console.log("user is not logged in");
    //return <LoginPage engine={engine}/>
    return <EngineProvider value={engine}>
      <BrowserRouter>
      <Messages messages={ engine.messages } acknowledge={ () => engine.clearMessages() } />
      <Container fluid>
        <Routes>  
          <Route path={`/pub/fill/:id`} element={<FormFillPage />} />
          <Route path="*" element={<LoginPage engine={engine} />} />
        </Routes>
      </Container>
      </BrowserRouter>    
   </EngineProvider>
  }

  return <EngineProvider value={engine}>
  <BrowserRouter>
   <Header/>
   <Messages messages={ engine.messages } acknowledge={ () => engine.clearMessages() } />
   <Container fluid className="pt-5 p-lg-5">
     <Routes>  
       <Route path="/" element={<Home />} />
       <Route path="/profile" element={<Profile />} />

       <Route path="/process/seminars" element={<ManageSeminars/>}/>
       <Route path="/process/seminars/add" element={<AddSeminar/>}/>
       <Route path="/process/seminars/add/:id" element={<AddSeminar/>}/>

       <Route path="/process/conferences" element={<ManageConferences/>}/>
       <Route path="/process/conferences/add" element={<AddConference/>}/>
       <Route path="/process/conferences/add/:id" element={<AddConference/>}/>

       <Route path="/process/my/visits" element={<ProcessVisits variant="my/"/>}/>
       <Route path="/process/my/visits/:id" element={<ProcessVisit variant="my/"/>}/>
       <Route path="/process/visits" element={<ProcessVisits variant=""/>}/>
       <Route path="/process/visits/:id" element={<ProcessVisit variant=""/>}/>
       <Route path="/process/visitsList" element={<ProcessVisitsList variant=""/>}/>
       
       <Route path="/process/roomAssignmentsList" element={<ProcessRoomAssignmentsList variant=""/>}/>

       <Route path="/process/roomLabels" element={<ManageRoomLabels/>}/>

       <Route path="/process/sanityCheck" element={<SanityCheck/>}/>
       <Route path="/process/changeRoom" element={<ChangeRoom/>}/>

       <Route path="/process/my/urls" element={<ProcessUrls/>}/>
       <Route path="/process/my/urls/:id" element={<ProcessUrl/>}/>
      
       <Route path="/process/my/courses" element={<ManageCourses variant="my/"/>}/>
       <Route path="/process/courses/add" element={<AddCourse variant="my/"/>}/>
       <Route path="/process/my/courses/add/:id" element={<AddCourse variant="my/"/>}/>
       <Route path="/process/courses" element={<ManageCourses variant=""/>}/>
       <Route path="/process/courses/add" element={<AddCourse variant=""/>}/>
       <Route path="/process/courses/add/:id" element={<AddCourse variant=""/>}/>

       <Route path="/process/document/:id" element={<Document />} />

       
       {  Object.values(Models).map(x => x.routers()) }
       
       <Route path="/map" element={<Map />} />
       
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
