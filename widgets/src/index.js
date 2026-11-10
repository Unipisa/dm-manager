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
import { VisitList } from './components/VisitList';
import { StaffList } from './components/StaffList';
import { PersonDetails } from './components/PersonDetails';
import { PersonCard } from './components/PersonCard';
import { GroupCards } from './components/GroupCards';
import { PeopleCards } from './components/PeopleCards';
import { CourseList } from './components/CourseList';
import { Course } from './components/Course';
import { Grant } from './components/Grant';
import { GrantList } from './components/GrantList';
import { ThesisList } from './components/ThesisList';
import { getManageURL } from './utils'

import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you

const queryClient = new QueryClient()

export const dmwidgets = {
    localDevelopment: false
}

dmwidgets.getManageURL = (path, query) => {
    return getManageURL(path, query)
}

// `widget` routes the generic shortcode; components receive only their own options.
dmwidgets.loadComponent = (target, name, { widget: _widget, ...props } = {}) => {

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
        case 'VisitList':
            element = <VisitList {...props}></VisitList>
            break;
        case 'StaffList':
            element = <StaffList {...props}></StaffList>
            break;
        case 'PersonDetails':
            element = <PersonDetails {...props}></PersonDetails>
            break;
        case 'PeopleCards':
            element = <PeopleCards {...props} />
            break;
        case 'PersonCard':
            element = <PersonCard {...props}></PersonCard>
            break;
        case 'GroupCards':
            element = <GroupCards {...props}></GroupCards>
            break;
        case 'CourseList':
            element = <CourseList {...props}></CourseList>
            break;
        case 'Course':
            element = <Course {...props} />
            break;
        case 'Grant':
            element = <Grant {...props}></Grant>
            break;
        case 'GrantList':
            element = <GrantList {...props}></GrantList>
            break;
        case 'ThesisList':
            element = <ThesisList {...props}></ThesisList>
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
