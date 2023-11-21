import React from 'react'

export function Loading({ widget, error }) {
    if (error) {
        return <div className="w-100 text-center m-5 h4">
            {widget}
            <div className="h5 mt-3">Si è verificato un errore durante il caricamento</div>
            <div className="h5 mt-3">{error.message}</div>
        </div>  
    }

    return <div className="w-100 text-center m-5 h4">
        {widget}
        <div className="h5 mt-3">Caricamento del blocco in corso...</div>
    </div>    
}