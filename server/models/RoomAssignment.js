const {
    Schema, 
    model, 
    ObjectId,
    startDate,
    endDate,
    createdBy, 
    updatedBy, 
    notes
} = require('./Model')

const schema = new Schema({
    person: { type: ObjectId, label: 'persona', ref: 'Person', required: true },
    room: { type: ObjectId, label: 'stanza', ref: 'Room', required: true },
    startDate,
    endDate,
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const RoomAssignment = model('RoomAssignment', schema)

module.exports = RoomAssignment

const Person = require('./Person')

Person.relatedModels.push({
    model: RoomAssignment,
    modelName: 'RoomAssignment',
    url: 'roomAssignment',
    field: 'person',
})

const Room = require('./Room')

Room.relatedModels.push({
    model: RoomAssignment,
    modelName: 'RoomAssignment',
    url: 'roomAssignment',
    field: 'room',
})

RoomAssignment.personRoomAssignmentPipeline = () => ([
    {$lookup: {
        from: "roomassignments",
        let: { start: "$startDate", end: "$endDate" },
        localField: 'person._id',
        foreignField: "person",
        as: 'roomAssignments',
        pipeline: [
            // inserisce i dati della stanza
            {$lookup: {
                from: "rooms",
                localField: "room",
                foreignField: "_id",
                as: "room",
            }},
            {$project: {
                "startDate": 1,
                "endDate": 1,
                "room._id": 1,
                "room.building": 1,
                "room.floor": 1,
                "room.number": 1,
            }},
            // tiene solo le assegnazioni che includono il periodo [start, end] 
            {$match: {
                $expr: {
                    $and: [
                        { $or: [
                            { $eq: ["$$end", null] },
                            { $eq: ["$startDate", null] },
                            { $lte: ["$startDate", "$$end"] } ]},
                        { $or: [
                            { $eq: ["$$start", null] },
                            { $eq: ["$endDate", null] },
                            { $gte: ["$endDate", "$$start"] } ]}
                    ]},
                },
            },
            {$unwind: {
                path: "$room",
                preserveNullAndEmptyArrays: true
            }},
            // ordina per data finale...
            // l'ultima assegnazione dovrebbe essere quella attuale
            {$sort: {"endDate": 1}},
        ]
    }},
    { $addFields: {
        roomAssignment: {
            $ifNull: [
                { $arrayElemAt: ["$roomAssignments", -1] },
                null
            ]
        }
    }}
])
