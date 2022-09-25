import { useState, useEffect } from 'react'

import engine from '../engine'

async function connect(setMsg) {
    setMsg(null)
    try {
        await engine.connect()
        await engine.login()
    } catch(err) {
        console.error(err)
        setMsg(err.message)
    }
}

export default function Connecting() {
    const [ msg, setMsg ] = useState(null)

    useEffect(() => {         
        connect(setMsg) }, [setMsg])

    if (msg) return <p>
        Errore di connessione: { msg } 
            <button onClick={ () => connect(setMsg) }>riprova</button>
        </p>

    return <p>Connessione in corso...</p>
}