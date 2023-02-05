import { useParams, Link } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import ModelView from '../components/ModelView'
import Loading from '../components/Loading'
import RelatedDetails from '../components/RelatedDetails'
import { ObjectProvider, useObject } from '../components/ObjectProvider'

export default function RoomViewPage() {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const Room = engine.Models.Room

    return <ObjectProvider path={Room.code} id={id}>
        <ModelView Model={Room}/>
        <RoomAssignments />
        <RelatedDetails Model={Room}/>
    </ObjectProvider>
}

function RoomAssignments() {
    const room = useObject()
    const engine = useEngine()
    const assignmentsQuery = engine.useIndex('roomAssignment', {'room': room._id, '_sort': '-startDate'})
    if (!assignmentsQuery.isSuccess) return <Loading />
    const assignments = assignmentsQuery.data.data
    return <ul>
        { assignments.map(assignment => <li key={assignment._id}>
            <Link to={`/roomAssignment/${assignment._id}`}>
                {myDateFormat(assignment.startDate)}- 
                {myDateFormat(assignment.endDate)}
            </Link>: <b>{
                    assignment.person
                    ? <Link to={`/person/${assignment.person._id}`}>
                        {assignment.person.firstName}   {assignment.person.lastName}
                      </Link>
                    : '...'}
                </b>
        </li>)}
    </ul>
}
