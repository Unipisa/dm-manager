import { useState, useEffect } from 'react'

export default function Connecting({ api, setApi }) {
    const [ msg, setMsg ] = useState(null)

    async function connect() {
        setMsg(null)
        try {
            await api.connect()
            await api.login()
            setApi(api.sync())
        } catch(err) {
            console.error(err)
            setMsg(err.message)
        }
    }
      
    useEffect(() => { connect() }, [])

    if (msg) return <p>Errore di connessione: { msg } <button onClick={ connect }>riprova</button></p>

    return <p>Connessione in corso...</p>
}