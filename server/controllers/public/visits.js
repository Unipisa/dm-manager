const Visit = require('../../models/Visit')
const { personRoomAssignmentPipeline } = require('../../models/RoomAssignment')

async function visitsQuery(req) {
    const pipeline = [
        { $match: {
            startDate: {$lte: new Date()},
            endDate: {$gte: new Date()}
        }},
        { $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'person',
        }},
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true
        }},
        ...personRoomAssignmentPipeline(),
        {$lookup: {
            from: 'institutions',
            localField: 'person.affiliations',
            foreignField: '_id',
            as: 'person.affiliations',
            pipeline: [
                {$project: {
                    _id: 1,
                    name: 1,
                    code: 1,
                    city: 1,
                    country: 1,
                }}
            ]
        }},
        { $project: {
            _id: 0,
            startDate: 1,
            endDate: 1,
            affiliations: 1,
            person: {
                firstName: 1,
                lastName: 1,
                affiliations: {
                    name: 1
                }
            },
            roomAssignment: {
                room: {
                    building: 1,
                    floor: 1,
                    number: 1,
                }
            },
        }},
    ]

    // console.log(JSON.stringify({pipeline}))

    const visits = await Visit.aggregate(pipeline)

    return visits
}

module.exports = visitsQuery
