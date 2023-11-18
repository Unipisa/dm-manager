import ReactDOM from 'react-dom/client';
import React from 'react'
import { EventList } from './components/EventList'
import { SeminarList } from './components/SeminarList';

// import 'bootstrap/dist/css/bootstrap.min.css';

const dmwidgets = {
    loadComponent: function (target, name, props = {}) {

        switch (name) {
            case 'EventList':
                ReactDOM.createRoot(target).render(<EventList {...props}></EventList>)
                break;
            case 'SeminarList':
                ReactDOM.createRoot(target).render(<SeminarList {...props}></SeminarList>)
                break;
            default:
                console.log("Unsupported element: " + name)
        }
    }
}

window.dmwidgets = dmwidgets