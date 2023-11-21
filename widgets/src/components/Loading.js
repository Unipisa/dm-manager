import React from 'react'

export function Loading({ widget }) {
    return <div className="w-100 text-center m-5 h4">
        {widget}
        <div className="h5 mt-3">Caricamento del blocco in corso...</div>
    </div>    
}