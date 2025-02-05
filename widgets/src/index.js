import ReactDOM from 'react-dom/client';
import React from 'react'
import { EventList } from './components/EventList'
import { SeminarList } from './components/SeminarList'
import { Seminar } from './components/Seminar'
import { Conference } from './components/Conference'
import { ConferenceList } from './components/ConferenceList';
import { QueryClient, QueryClientProvider } from 'react-query'
import { HomeEventList } from './components/HomeEventList';
import { HomeGrantList } from './components/HomeGrantList';
import { HomeVisitList } from './components/HomeVisitList';
import { PersonDetails } from './components/PersonDetails';
import { CourseList } from './components/CourseList';
import { Grant } from './components/Grant';
import { getManageURL } from './utils'

import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you

const queryClient = new QueryClient()

export const dmwidgets = {
    localDevelopment: false
}

dmwidgets.getManageURL = (path, query) => {
    return getManageURL(path, query)
}

dmwidgets.loadComponent = (target, name, props = {}) => {

    var element = null

    switch (name) {
        case 'EventList':
            element = <EventList {...props}></EventList>
            break;
        case 'SeminarList':
            element = <SeminarList {...props}></SeminarList>
            break;
        case 'Seminar':
            element = <Seminar {...props}></Seminar>
            break;
        case 'Conference':
            element = <Conference {...props}></Conference>
            break;
        case 'ConferenceList':
            element = <ConferenceList {...props}></ConferenceList>
            break;
        case 'HomeEventList':
            element = <HomeEventList {...props}></HomeEventList>
            break;
        case 'HomeGrantList':
            element = <HomeGrantList {...props}></HomeGrantList>
            break;
        case 'HomeVisitList':
            element = <HomeVisitList {...props}></HomeVisitList>
            break;
        case 'PersonDetails':
            element = <PersonDetails {...props}></PersonDetails>
            break;
        case 'CourseList':
            element = <CourseList {...props}></CourseList>
            break;
        case 'Grant':
            element = <Grant {...props}></Grant>
            break;

        default:
            console.log("Unsupported element: " + name)
    }

    if (element !== null) {
        ReactDOM.createRoot(target).render(<QueryClientProvider client={queryClient}>
            {element}
        </QueryClientProvider>)
    }
}

window.dmwidgets = dmwidgets