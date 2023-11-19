import ReactDOM from 'react-dom/client';
import React from 'react'
import { EventList } from './components/EventList'
import { SeminarList } from './components/SeminarList'
import { Seminar } from './components/Seminar'

// import 'bootstrap/dist/css/bootstrap.min.css';
import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you

const dmwidgets = {
    loadComponent: function (target, name, props = {}) {

        switch (name) {
            case 'EventList':
                ReactDOM.createRoot(target).render(<EventList {...props}></EventList>)
                break;
            case 'SeminarList':
                ReactDOM.createRoot(target).render(<SeminarList {...props}></SeminarList>)
                break;
            case 'Seminar':
                ReactDOM.createRoot(target).render(<Seminar {...props}></Seminar>)
                break;
            default:
                console.log("Unsupported element: " + name)
        }
    }
}

window.dmwidgets = dmwidgets