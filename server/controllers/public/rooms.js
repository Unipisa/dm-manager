const Room = require('../../models/Room')

async function roomsQuery(req, res) {
    // Find all rooms, and return only the data required for the planimetrie module
    const rooms = await Room.aggregate([
        {$project: {
            _id: 1, 
            name: 1,
            notes: 1,
            code: 1, 
            polygon: 1
        }}
    ])

    return { 
        data: rooms
    }
}

module.exports = roomsQuery