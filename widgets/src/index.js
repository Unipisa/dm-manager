import ReactDOM from 'react-dom/client';
import React from 'react'
import { EventList } from './components/EventList'

import 'bootstrap/dist/css/bootstrap.min.css';

const dmwidgets = {
    loadComponent: function (target, name, props = {}) {

        switch (name) {
            case 'EventList':
                ReactDOM.createRoot(target).render(<EventList {...props}></EventList>)
                break;
            default:
                console.log("Unsupported element: " + name)
        }
    }
}

window.dmwidgets = dmwidgets