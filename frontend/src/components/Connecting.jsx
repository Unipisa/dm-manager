import { useState } from 'react'

async function connect(engine, setMsg) {
    setMsg(null)
    try {
        const config = await engine.connect()
        if (config === null) setMsg('connessione al server fallita')
    } catch(err) {
        console.error(err)
        setMsg(err.message)
    }
}

export default function Connecting({engine}) {
    const [ retry, setRetry ] = useState(true)
    const [ msg, setMsg ] = useState(null)

    if (engine && retry) {
        setRetry(false)
        connect(engine, setMsg)
    }

    if (msg) return <p>
        Errore di connessione: { msg } 
            <button onClick={ () => setRetry(true) }>riprova</button>
        </p>

    return <p></p>
}