const Visit = require('../../models/Visit')
const { personRoomAssignmentPipeline } = require('../../models/RoomAssignment')

async function visitsQuery(req) {
    const pipeline = [
        {$match: {
            $expr: {
                $and: [
                    { $or: [
                        { $eq: ["$endDate", null] },
                        { $gte: ["$endDate", {
                            $dateAdd: {
                                startDate: "$$NOW", 
                                unit: "day",
                                amount: -1
                            }}] } ]},
                    { $or: [
                        { $eq: ["$startDate", null] },
                        { $lte: ["$startDate", "$$NOW"]}
                    ]}
                ]},
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

    const visits = await Visit.aggregate(pipeline)

    return {
        data: visits
    }
}

module.exports = visitsQuery
