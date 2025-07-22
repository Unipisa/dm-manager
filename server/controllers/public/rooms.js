const Room = require('../../models/Room')
const RoomAssignment = require('../../models/RoomAssignment')

async function roomsQuery(req, res) {
    // Find all rooms, and return only the data required for the planimetrie module
    const rooms = await Room.aggregate([
        {$project: {
            _id: 1, 
            name: 1,
            description: 1,
            code: 1,
            building: 1,
            floor: 1,
            number: 1,
            polygon: 1,
        }},
        ...RoomAssignment.roomRoomAssignmentPipeline(
            { $dateTrunc: { date: "$$NOW", unit: "day" } },
            { $dateTrunc: { date: "$$NOW", unit: "day" } }
        ),
    ])

    return { 
        data: rooms
    }
}

module.exports = roomsQuery