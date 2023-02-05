import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'

import { useEngine, myDateFormat } from '../Engine'
import ModelView from '../components/ModelView'
import Loading from '../components/Loading'
import { ObjectProvider, useObject } from '../components/ObjectProvider'
import { Card } from 'react-bootstrap'

export default function RoomViewPage() {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const Room = engine.Models.Room

    return <ObjectProvider path={Room.code} id={id}>
        <ModelView Model={Room}/>
        <RoomAssignments />
    </ObjectProvider>
}

function RoomAssignments() {
    const room = useObject()
    const engine = useEngine()
    const assignmentsQuery = engine.useIndex('roomAssignment', {'room': room._id, '_sort': '-startDate'})
    const [filter, setFilter] = useState('current')

    if (!assignmentsQuery.isSuccess) return <Loading />
    const assignments = assignmentsQuery.data.data
    const today = new Date()

    const filteredAssignments = assignments.filter(assignment => {
        switch(filter) {
            case 'all': return true
            case 'current': return (assignment.startDate===null || assignment.starDate <= today) 
                && (assignment.endDate===null || today <= assignment.endDate)
            case 'past': return assignment.endDate !== null && assignment.endDate < today
            case 'future': return assignment.startDate !== null && assignment.startDate > today
            default:
                return false
        }
    })

    return <Card className="mt-2">
        <Card.Header><h4>Assegnazioni</h4></Card.Header>
        <Card.Body>
            <select onChange={event => setFilter(event.target.value)} value={filter}>
                <option value="all">Tutte</option>
                <option value="current">Correnti</option>
                <option value="past">Passate</option>
                <option value="future">Future</option>
            </select>
            <ul>
            {    
                filteredAssignments.map(assignment => <li key={assignment._id}>
                <Link to={`/roomAssignment/${assignment._id}`}>
                    {myDateFormat(assignment.startDate)}- 
                    {myDateFormat(assignment.endDate)}
                </Link>: <b>{
                    assignment.person
                    ? <Link to={`/person/${assignment.person._id}`}>
                            {assignment.person.firstName}   {assignment.person.lastName}
                        </Link>
                        : '???'}
                    </b>
            </li>)}
            </ul>
            { filteredAssignments.length === 0 && 'nessuna assegnazione'}
        </Card.Body>
    </Card> 
}
