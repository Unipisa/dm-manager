import {Link} from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import RelatedDetails from './RelatedDetails'
import Loading from '../components/Loading'

function RoomAssignments({room}) {
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

export default function RoomDetails({obj}) {
    const engine = useEngine()
    const related = engine.useGetRelated('Room', obj._id)

    return <>
        <RoomAssignments room={obj}/>
        <RelatedDetails related={related} />
    </>
}

