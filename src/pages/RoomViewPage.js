import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Button, Card } from 'react-bootstrap'

import { useEngine, myDateFormat, notNullStartDate, notNullEndDate } from '../Engine'
import ModelView from '../components/ModelView'
import Loading from '../components/Loading'
import { ObjectProvider, useObject } from '../components/ObjectProvider'

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
    const {useIndex} = useEngine()
    const assignmentsQuery = useIndex('roomAssignment', {'room': room._id, '_sort': '-startDate'})
    const [filter, setFilter] = useState('current')

    if (!assignmentsQuery.isSuccess) return <Loading />
    const assignments = assignmentsQuery.data.data
    const today = new Date()

    const filteredAssignments = assignments.filter(assignment => {
        const start = notNullStartDate(assignment.startDate)
        const end = notNullEndDate(assignment.endDate)
        switch(filter) {
            case 'all': return true
            case 'current': return start <= today && today <= end
            case 'past': return end < today
            case 'future': return start > today
            default:
                return false
        }
    })

    const currentNames = assignments
        .filter(assignment => {
            const start = notNullStartDate(assignment.startDate)
            const end = notNullEndDate(assignment.endDate)
            return start <= today && today <= end
        })
        .filter(assignment => assignment.person)
        .map(assignment => assignment.person.firstName + ' ' + assignment.person.lastName)

    return <Card className="mt-2">
        <Card.Header>
            <h4>Assegnazioni</h4>
        </Card.Header>
        <Card.Body>
            {filter==='current' && <>
                <LabelButton number={room.number} names={currentNames}/>
                <br />
                </>
            }
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

function LabelButton({number, names}) {
    const room = useObject()
    const engine = useEngine()
    const labelsQuery = engine.useIndex('roomLabel', {'number': room.number })
    const putLabel = engine.usePut('roomLabel')

    if (!labelsQuery.isSuccess) return <Loading />
    const labels = labelsQuery.data.data
        .filter(label => label.number===number && label.names.join(', ')===names.join(', '))

    async function submit() {
        await putLabel({
            number,
            names,
            state: 'submitted',
            size: names.length>5 ? -1 : 0,
        })
    }
    
    if (labels.length>0) {
        return labels.map(label => <a key={label._id} href={`/roomLabel?${label._id}`}>vedi cartellino {label.state==='managed'?'stampato':'richiesto'}</a>)
    }
    
    return <Button className="m-2" onClick={submit}>stampa cartellino</Button>
}