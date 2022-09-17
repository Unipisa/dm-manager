import { useState } from 'react'
import { Card } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import MyInput from './MyInput'

export default function VisitPage({ engine }) {
    const { id } = useParams()
    const create = (id === 'new')
    const [ visit, setVisit ] = useState({
        lastName: "",
        firstName: "",
        affiliation: "",
        email: "",
        startDate: "",
        endDate: "",
        building: "",
        roomNumber: "",
    })
    const [done, setDone ] = useState(false)

    const change = (evt) => {
        const { name, value } = evt.target
        setVisit(visit => {
            visit = {...visit}
            visit[name] = value
            return visit
        })
    }
    
    const submit = async (evt) => {
        engine.putVisit(visit)
        engine.addInfoMessage(create?"Nuova visita inserita":"visita modificata")
        setDone(true)
    }

    if (done) return <Navigate to="/visits" />

    return <Card>
        <Card.Header>
            <h3>{ create ? `nuovo visitatore` : `visita ${id}` }</h3>
        </Card.Header>
        <Card.Body>
        <form onSubmit={ (event) => {
            // login(email,password)
            event.preventDefault()
            }}
        >
                <MyInput name="firstName" label="nome" store={ visit } onChange={ change } /> 
                <MyInput name="lastName" label="cognome" store={ visit } onChange={ change } />
                <MyInput name="affiliation" label="affiliazione" store={ visit } onChange={ change } />
                <MyInput name="email" label="email" store={ visit } onChange={ change } />
                <MyInput name="startDate" label="inizio" store={ visit } onChange={ change } type="Date" />
                <MyInput name="endDate" label="fine" store={ visit } onChange={ change } type="Date" />
                <MyInput name="building" label="edificio" store={ visit } onChange={ change } />
                <MyInput name="roomNumber" label="stanza" store={ visit } onChange={ change } />
                <br />
                <input onClick={ submit } className="btn btn-primary" type="submit" value="aggiungi visitatore" />
            </form>
        </Card.Body>
    </Card>
}
