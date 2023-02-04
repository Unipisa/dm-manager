import { useParams, Link } from 'react-router-dom'
import { Card } from 'react-bootstrap'

import { useEngine, myDateFormat } from '../Engine'
import ModelView from '../components/ModelView'
import Timestamps from '../components/Timestamps'
import Loading from '../components/Loading'
import RelatedDetails from './RelatedDetails'

export default function RoomViewPage({ Model }) {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const query = engine.useGet(Model.code, id)

    if (query.isError) return <div>errore caricamento</div>
    if (!query.isSuccess) return <Loading />

    const room = query.data

    return <>
        <Card>
            <Card.Header>
                <h3>{ `${Model.name} ${Model.describe(room)}` }</h3>
            </Card.Header>
            <Card.Body>
                <ModelView Model={Model} obj={room}/>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={room} />
            </Card.Footer>
        </Card>
        <RoomDetails room={room} />
    </>
}

function RoomDetails({room}) {
    const engine = useEngine()
    const related = engine.useGetRelated('Room', room._id)

    return <>
        <RoomAssignments room={room}/>
        <RelatedDetails related={related} />
    </>
}

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
