import { useState } from 'react'
import { Button } from 'react-bootstrap'

import { myDateFormat, useEngine, minDate, maxDate, notNullEndDate, notNullStartDate } from '../Engine'
import Loading from './Loading'

function RoomListing({rooms, createAssignment}) {
    const [floor, setFloor] = useState('free')
    const floors = rooms
        .map(room => `${room.building}${room.floor}`)
        .filter((label, i, self) => self.indexOf(label) === i)
    floors.sort()
    if (floor === 'free') {
        rooms = rooms.filter(room => room.freeSeats > 0)
        rooms.sort((a,b) => (b.freeSeats-a.freeSeats))
    } else {
        if (floor !== 'all') {
            rooms = rooms.filter(room => `${room.building}${room.floor}` === floor)
        }
        rooms.sort((a,b) => (a.code.localeCompare(b.code)))
    }
    return <>
        <select onChange={event => setFloor(event.target.value)}>
            <option value='free'>stanze con posti liberi</option>
            {floors.map(f => <option key={f} value={f}>{f}</option>)}
            <option value='all'>tutte</option>
        </select>
        <ul>
            {rooms.map(room => <li key={room._id}>
                <b><a href={`/room/${room._id}`}>{room.code}</a></b>
                {} <b>posti liberi: </b> 
                    <b className={room.freeSeats>0?"text-success":"text-danger"}>
                        {room.freeSeats}
                    </b>/{room.nSeats}
                {} <Button className='mb-1' size='sm' variant='warning' onClick={() => createAssignment(room)}>
                    assegna
                    </Button>
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
    const patchRoomAssignment = engine.usePatch('roomAssignment')
    const deleteRoomAssignment = engine.useDelete('roomAssignment')
    if (!(assignmentsQuery.isSuccess && roomsQuery.isSuccess)) return <Loading />
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
        const room = roomWithId[assignment.room?._id]
        if (room === undefined) {
            console.log(`internal error: room ${assignment.room?._id} not found in assignment ${assignment._id}`)
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

    const user_assignments = assignments.filter(assignment => assignment.person._id === person._id)
    

    return <>
        <h5>Assegnazioni inserite</h5>
        {user_assignments.length === 0 && <i>nessuna stanza assegnata</i>}
        <ul>
            { user_assignments.map(assignment =>
            <li key={assignment._id}>
                {} in <a href={`/room/${assignment.room._id}`}>{assignment.room.code}</a> 
                {} assegnazione <a href={`/roomassignment/${assignment._id}`}>{myDateFormat(assignment.startDate)}-{myDateFormat(assignment.endDate)}</a>
                { notNullStartDate(assignment.startDate) < notNullStartDate(startDate) && 
                    <Button className='m-1' onClick={() => patchRoomAssignment({_id: assignment._id, startDate})}>
                        metti data inizio {myDateFormat(startDate)}
                    </Button>}
                { notNullEndDate(assignment.endDate)>notNullEndDate(endDate) && 
                    <Button className='m-1' onClick={() => patchRoomAssignment({_id: assignment._id, endDate})}>
                        metti data fine {myDateFormat(endDate)}
                    </Button>}
                {} <Button className='m-1' size='sm' variant='danger' onClick={() => deleteRoomAssignment(assignment)}>
                        rimuovi
                    </Button>
            </li>)}
        </ul>
        <RoomListing rooms={rooms} createAssignment={createAssignment} />
    </>
}

