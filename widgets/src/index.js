import ReactDOM from 'react-dom/client';
import React from 'react'
import { EventList } from './components/EventList'
import { SeminarList } from './components/SeminarList'
import { Seminar } from './components/Seminar'
import { Conference } from './components/Conference'
import { QueryClient, QueryClientProvider } from 'react-query'

import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you

const queryClient = new QueryClient()

const dmwidgets = {
    loadComponent: function (target, name, props = {}) {

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
            default:
                console.log("Unsupported element: " + name)
        }

        if (element !== null) {
            ReactDOM.createRoot(target).render(<QueryClientProvider client={queryClient}>
                {element}
            </QueryClientProvider>)
        }
    }
}

window.dmwidgets = dmwidgets