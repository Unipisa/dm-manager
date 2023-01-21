import { Card } from 'react-bootstrap'
import { myDateFormat, useEngine } from '../Engine'

function RoomAssignmentHelperBody({ person, startDate, endDate }) {
    const engine = useEngine()
    const assignmentsQuery = engine.useIndex('roomAssignment', {
        startDate__lte: endDate,
        endDate__gte: startDate,
    })
    const roomsQuery = engine.useIndex('room', {})
    const putRoomAssignment = engine.usePut('roomAssignment')
    const deleteRoomAssignment = engine.useDelete('roomAssignment')
    if (!(assignmentsQuery.isSuccess && roomsQuery.isSuccess)) return <p>loading ...</p>
    const rooms = roomsQuery.data.data
    const assignments = assignmentsQuery.data.data
    const roomWithId = Object.fromEntries(rooms
        .map(room => [room._id, room]))
    rooms.forEach(room => room.list = [])
    let dates = [startDate, endDate]
    assignments.forEach(assignment => {
        console.log(`assignment: ${assignment.person.lastName} ${myDateFormat(assignment.startDate)}-${myDateFormat(assignment.endDate)}`)
        console.log(`${assignment.person._id} ? ${person._id}`)
        const room = roomWithId[assignment.room._id]
        if (room === undefined) {
            console.log(`internal error: room ${assignment.room._id} not found`)
            return
        }
        room.list.push([assignment.startDate, 1])
        room.list.push([assignment.endDate, -1])
        const pushDate= date => {
            if (date>=startDate && date <= endDate && !dates.includes(date)) dates.push(date)
        }
        pushDate(assignment.startDate)
        pushDate(assignment.endDate)
    })
    dates.sort((a, b) => a - b)

    rooms.forEach(room => {
        room.list.sort((a, b) => a[0] - b[0])
        room.max_occupation = 0
        let count = 0
        room.list.forEach((item, i) => {
            count += item[1]
            if (count > room.max_occupation) room.max_occupation = count
        })
        room.freeSeats = room.nSeats - room.max_occupation
    })
    rooms.sort((a, b) => b.freeSeats - a.freeSeats)

    function occupation(room, date) {
        const list = room.list
        let count = 0
        for (let i = 0; i < list.length; i++) {
            if (list[i][0] >= date) break
            count += list[i][1]
        }
        return count
    }

    function createAssignment(room) {
        console.log(`create assignment for ${person.lastName} ${person.firstName} in room ${room._id}`)
        const assignment = {
            person: person._id,
            room: room._id,
            startDate: startDate,
            endDate: endDate,
        }
        putRoomAssignment(assignment)
    }

    return <>
        { assignments.filter(assignment => assignment.person._id === person._id).map(assignment => 
            <p key={assignment._id}>
                {assignment.person.lastName} {assignment.person.firstName} in {assignment.room.building}{assignment.room.floor} {assignment.room.number} {myDateFormat(assignment.startDate)}-{myDateFormat(assignment.endDate)}
                <button onClick={() => deleteRoomAssignment(assignment)}>rimuovi</button>
            </p>)}
        <table>
            <thead>
                <tr>
                    <th>Assegna Stanza</th>
                    <th>posti</th>
                    {dates.slice(0,-1).map((date,i) => 
                        <th key={i}>{myDateFormat(date)}-{myDateFormat(dates[i+1])}</th>)}
                </tr>
            </thead>
            <tbody>
                {rooms.map(room => <tr key={room._id}>
                    <th>
                        <button onClick={() => createAssignment(room)}>
                            {room.building}{room.floor} {room.number}
                        </button>
                    </th>
                    <th>{room.freeSeats}</th>
                    {dates.slice(0,-1).map((date,i) =>
                        <td key={i}>
                            {occupation(room,date)}
                        </td>)}
                </tr>)}
            </tbody>
        </table>
    </>
}

export default function RoomAssignmentHelper({ person, startDate, endDate }) {
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