import { useState, useEffect } from 'react'

async function connect(api, setMsg) {
    setMsg(null)
    try {
        await api.connect()
        await api.login()
    } catch(err) {
        console.error(err)
        setMsg(err.message)
    }
}

export default function Connecting({ api }) {
    const [ msg, setMsg ] = useState(null)

    useEffect(() => {         
        connect(api, setMsg) }, [api])

    if (msg) return <p>
        Errore di connessione: { msg } 
            <button onClick={ () => connect(api, setMsg) }>riprova</button>
        </p>

    return <p>Connessione in corso...</p>
}