import { Card } from 'react-bootstrap'
import { myDateFormat, useEngine, minDate, maxDate } from '../Engine'

function RoomAssignmentHelperBody({ person, startDate, endDate }) {
    const engine = useEngine()
    startDate = startDate ? new Date(startDate) : minDate
    endDate = endDate ? new Date(endDate) : maxDate
    let filter = {
        endDate__gte_or_null: startDate.toISOString(),
        startDate__lte_or_null: endDate.toISOString()
    }
    const assignmentsQuery = engine.useIndex('roomAssignment', filter)
    const roomsQuery = engine.useIndex('room', {})
    const putRoomAssignment = engine.usePut('roomAssignment')
    const deleteRoomAssignment = engine.useDelete('roomAssignment')
    if (!(assignmentsQuery.isSuccess && roomsQuery.isSuccess)) return <p>loading ...</p>
    const rooms = roomsQuery.data.data
    const assignments = assignmentsQuery.data.data
    const roomWithId = Object.fromEntries(rooms
        .map(room => [room._id, room]))

    rooms.forEach(room => {
        room.periods = []
        room.occupiedSeats = 0
        room.freeSeats = room.nSeats
    })

    assignments.forEach(assignment => {
        const room = roomWithId[assignment.room._id]
        if (room === undefined) {
            console.log(`internal error: room ${assignment.room._id} not found`)
            return
        }
        let start = assignment.startDate ? new Date(assignment.startDate) : minDate
        let end = assignment.endDate ? new Date(assignment.endDate) : maxDate
        if (start >= endDate || end <= startDate) return
        if (end > endDate) end = endDate
        if (start < startDate) start = startDate
        const saved = room.periods
        room.periods = []
        function max(a, b) { return a > b ? a : b }
        function min(a, b) { return a < b ? a : b }
        saved.forEach(a => {
            if (start > a.endDate || end < a.startDate) return

            // split start
            if (start > a.startDate) {
                room.periods.push({
                    startDate: a.startDate,
                    endDate: start,
                    assignments: a.assignments,
                })
            }

            // keep central
            if (a.assignments.length === room.occupiedSeats) {
                room.occupiedSeats++
                room.freeSeats = room.nSeats - room.occupiedSeats
            }
            room.periods.push({
                startDate: max(a.startDate, start),
                endDate: min(a.endDate, end),
                assignments: [...a.assignments, assignment],
            })

            // split end
            if (end < assignment.endDate) {
                room.periods.push({
                    startDate: end,
                    endDate: a.endDate,
                    assignments: a.assignments,
                })
            }
        })
        if (saved.length === 0) {
            room.periods.push({
                startDate: start,
                endDate: end,
                assignments: [assignment],
            })
            room.occupiedSeats++
            room.freeSeats = room.nSeats - room.occupiedSeats
        }
    })

    function createAssignment(room) {
        console.log(`create assignment for ${person.lastName} ${person.firstName} in room ${room._id}`)
        const assignment = {
            person: person._id,
            room: room._id,
            startDate: startDate,
            endDate: endDate,
        }
        putRoomAssignment(assignment, () => {
            console.log(`assignment created`)
            engine.addMessage(`Assegnata stanza ${room.building}${room.floor} ${room.number} a ${person.lastName} ${person.firstName}`, 'success')
        })
    }

    rooms.sort((a,b) => (b.freeSeats-a.freeSeats))

    return <>
        {assignments.filter(assignment => assignment.person._id === person._id).map(assignment =>
            <p key={assignment._id}>
                <a href={`/roomassignment/${assignment._id}`}>{assignment.person.lastName} {assignment.person.firstName}</a> 
                {} in <a href={`/room/${assignment.room._id}`}>{assignment.room.code}</a> 
                {} assegnazione <a href={`/roomassignment/${assignment._id}`}>{myDateFormat(assignment.startDate)}-{myDateFormat(assignment.endDate)}</a>
                {} <button onClick={() => deleteRoomAssignment(assignment)}>rimuovi</button>
            </p>)}
        <ul>
            {rooms.map(room => <li key={room._id}>
                <button onClick={() => createAssignment(room)}>
                    assegna
                </button>
                <b> <a href={`/room/${room._id}`}>{room.code}</a></b>
                <b> posti:</b> {room.nSeats},
                <b>occupati:</b> {room.occupiedSeats},
                <b>liberi:</b> {room.freeSeats}
                <ul>
                    {room.periods.map(period =>
                        <li key={period.startDate}>
                            <i>{myDateFormat(period.startDate)}-{myDateFormat(period.endDate)}: </i>
                            {period.assignments.map((a,i) => <span key={a._id}>{i?', ':''}<a href={`/roomassignment/${a._id}`}>{a.person.lastName}</a></span>)}
                        </li>)}
                </ul>
            </li>)}
        </ul>
    </>
}

export default function RoomAssignmentHelper({ person, startDate, endDate }) {
    console.assert(!startDate || typeof (startDate) === 'Date')
    console.assert(!endDate || typeof (endDate) === 'Date')
    return <Card>
        <Card.Header>
            <h3>Assegnazione stanza {person.lastName} {person.firstName}</h3>
            <h2>{myDateFormat(startDate)}-{myDateFormat(endDate)}</h2>
        </Card.Header>
        <Card.Body>
            <RoomAssignmentHelperBody person={person} startDate={startDate} endDate={endDate} />
        </Card.Body>
    </Card>
}