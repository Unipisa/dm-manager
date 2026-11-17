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

RoomAssignment.personRoomAssignmentPipeline = (startDate = '$startDate', endDate = '$endDate', sort = { endDate: 1 }) => ([
    {$lookup: {
        from: "roomassignments",
        let: { start: startDate, end: endDate },
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
                "room.code": 1,
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
            // The last result is selected below; callers can choose its ordering.
            {$sort: sort},
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

// Keep every assignment overlapping the record's period for management views.
// Select one room at today's date, or at the nearest boundary for past/future records.
RoomAssignment.personPeriodRoomAssignmentPipeline = (startDate = '$startDate', endDate = '$endDate') => {
    const [assignmentsLookup] = RoomAssignment.personRoomAssignmentPipeline(startDate, endDate, { startDate: 1, _id: 1 })
    const referenceDate = { $switch: {
        branches: [
            { case: { $and: [
                { $ne: [{ $ifNull: [startDate, null] }, null] },
                { $gt: [startDate, '$$NOW'] },
            ] }, then: startDate },
            { case: { $and: [
                { $ne: [{ $ifNull: [endDate, null] }, null] },
                { $lt: [endDate, '$$NOW'] },
            ] }, then: endDate },
        ],
        default: '$$NOW',
    } }
    return [assignmentsLookup, { $addFields: {
        roomAssignment: { $let: {
            vars: { at: referenceDate },
            in: { $ifNull: [{ $arrayElemAt: [{ $filter: {
                input: '$roomAssignments', as: 'assignment',
                cond: { $and: [
                    { $lte: [{ $ifNull: ['$$assignment.startDate', '$$at'] }, '$$at'] },
                    { $gte: [{ $ifNull: ['$$assignment.endDate', '$$at'] }, '$$at'] },
                ] },
            } }, -1] }, null] },
        } },
    } }]
}

RoomAssignment.roomRoomAssignmentPipeline = (startDate = '$startDate', endDate = '$endDate') => ([
    {$lookup: {
        from: "roomassignments",
        let: { start: startDate, end: endDate },
        localField: '_id',
        foreignField: "room",
        as: 'roomAssignments',
        pipeline: [
            // inserisce i dati della persona
            {$lookup: {
                from: "people",
                localField: "person",
                foreignField: "_id",
                as: "person",
            }},
            {$project: {
                "startDate": 1,
                "endDate": 1,
                "person._id": 1,
                "person.firstName": 1,
                "person.lastName": 1,
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
                path: "$person",
                preserveNullAndEmptyArrays: true
            }},
            // ordina per data finale...
            // l'ultima assegnazione dovrebbe essere quella attuale
            {$sort: {"endDate": 1}},
        ]
    }}
])
