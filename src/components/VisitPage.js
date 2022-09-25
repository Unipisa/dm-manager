import { useState, useEffect } from 'react'
import { Card } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import MyInput from './MyInput'
import engine from '../engine'

export default function VisitPage() {
    const { id } = useParams()
    const create = (id === 'new')
    const [ original, setOriginal ] = useState(null)
    const [ visit, setVisit ] = useState(original)
    const [ done, setDone ] = useState(false)
    const changed = original===null 
        ? null 
        : Object.entries(visit).some(([key, val])=>{
            return val !== original[key]})

    useEffect(() => {(async () => {
        let visit = null
        if (create) {
            visit = {
                lastName: "",
                firstName: "",
                affiliation: "",
                email: "",
                startDate: "",
                endDate: "",
                building: "",
                roomNumber: "",
                invitedBy: "",
                notes: "",
            }
        } else {
            visit = await engine.getVisit(id)
        }
        setVisit(v => ({...v, ...visit}))
        setOriginal(v => ({...v, ...visit}))
    })()}, [create, id])

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
            let payload = Object.fromEntries(Object.entries(visit)
                .filter(([key, val]) => (original[key]!==val)))
            try {
                await engine.patchVisit(visit._id, payload)
                await engine.addInfoMessage("visita modificata")
                setDone(true)
            } catch(err) {
                await engine.addErrorMessage(err.message)
            }
        } else {
            try {
                await engine.putVisit(visit)
                await engine.addInfoMessage("Nuova visita inserita")
                setDone(true)
            } catch(err) {
                await engine.addErrorMessage(err.message)
            }
        }
    }

    if (done) return <Navigate to="/visits" />

    if (visit === null) return <div>loading...</div>

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
                    <MyInput name="invitedBy" label="referente" store={ visit } onChange={ change } />
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
                                disabled= { !changed }
                                value={create?"aggiungi visita":"aggiorna visita"} />
                        </td>
                    </tr>
                </tfoot>
            </table>
            </form>
        </Card.Body>
    </Card>
}
