import { useState, useEffect } from 'react'
import { Card } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import MyInput from './MyInput'

export default function VisitPage({ engine, api }) {
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

    useEffect(() => {(async () => {
        if (create) return;
        const visit = await api.getVisit(id)
        setVisit(v => ({...v, ...visit}))
    })()}, [create, api, id])

    const change = (evt) => {
        const { name, value } = evt.target
        setVisit(visit => {
            visit = {...visit}
            visit[name] = value
            return visit
        })
    }
    
    const submit = async (evt) => {
        if (visit._id) {
            await api.postVisit(visit)
            await engine.addInfoMessage("visita modificata")
        } else {
            await api.putVisit(visit)
            await engine.addInfoMessage("Nuova visita inserita")
        }
        setDone(true)
    }

    if (done) return <Navigate to="/visits" />

    // console.log(`visit: ${JSON.stringify(visit)}`)

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
            <table>
                <tbody>
                    <MyInput name="firstName" label="nome" store={ visit } onChange={ change } /> 
                    <MyInput name="lastName" label="cognome" store={ visit } onChange={ change } />
                    <MyInput name="affiliation" label="affiliazione" store={ visit } onChange={ change } />
                    <MyInput name="email" label="email" store={ visit } onChange={ change } />
                    <MyInput name="startDate" label="inizio" store={ visit } onChange={ change } type="Date" />
                    <MyInput name="endDate" label="fine" store={ visit } onChange={ change } type="Date" />
                    <MyInput name="building" label="edificio" store={ visit } onChange={ change } />
                    <MyInput name="roomNumber" label="stanza" store={ visit } onChange={ change } />
                </tbody>
                <tfoot>
                    <tr>
                        <td>
                            <input 
                                onClick={ submit } className="btn btn-primary" type="submit" 
                                value={create?"aggiungi visita":"aggiorna visita"} />
                        </td>
                    </tr>
                </tfoot>
            </table>
            </form>
        </Card.Body>
    </Card>
}
