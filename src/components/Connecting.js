import { useState, useEffect } from 'react'

async function connect(engine, setMsg) {
    setMsg(null)
    try {
        await engine.connect()
        await engine.login()
    } catch(err) {
        console.error(err)
        setMsg(err.message)
    }
}

export default function Connecting({ engine }) {
    const [ msg, setMsg ] = useState(null)

    useEffect(() => {         
        connect(engine, setMsg) }, [engine])

    if (msg) return <p>
        Errore di connessione: { msg } 
            <button onClick={ () => connect(engine, setMsg) }>riprova</button>
        </p>

    return <p>Connessione in corso...</p>
}