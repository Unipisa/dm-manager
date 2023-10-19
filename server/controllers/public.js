const Person = require('../models/Person')
const Visit = require('../models/Visit')
const { personRoomAssignmentPipeline } = require('../models/RoomAssignment')

async function staffQuery(req) {
    const matches = []

    if (req.query.email) {
        matches.push({ 'email': req.query.email },
            { 'alternativeEmails': req.query.email })
    }

    if (req.query.matricola) {
        matches.push({
            'staff.matricola': req.query.matricola
        })
    }

    const pipeline = [
        {
            $lookup: {
                from: 'staffs',
                localField: '_id',
                foreignField: 'person',
                as: 'staff',
                pipeline: [
                    {$match: {
                        $expr: {
                            $and: [
                                { $or: [
                                    { $eq: ["$endDate", null] },
                                    { $gte: ["$endDate", "$$NOW"] } ]},
                                { $or: [
                                    { $eq: ["$startDate", null] },
                                    { $lte: ["$startDate", "$$NOW"] } ]}
                            ]},
                    }},
                ]
            }
        },
        // remove entries with empty staff
        {
            $match: {
                'staff.0': {$exists: true}
            }
        },
        {$match: {
            $or: matches,
        }},
        {$lookup: {
            from: 'institutions',
            localField: 'affiliations',
            foreignField: '_id',
            as: 'affiliations'
        }},
        {
            $project: {
                _id: 0,
                firstName: 1,
                lastName: 1,
                gender: 1,
                email: 1,
                phone: 1,
                personalPage: 1,
                mathscinet: 1,
                google_scholar: 1,
                orcid: 1,
                photoUrl: 1,
                country: 1,
                arxiv_orcid: 1,
                affiliations: {
                    name: 1,
                },
                staff: {
                    qualification: 1,
                    photoUrl: 1,
                    isInternal: 1,
                }
            }
        }
    ]

    // console.log(JSON.stringify({pipeline}))

    const staffs = await Person.aggregate(pipeline)

    if (!staffs || staffs.length === 0) {
        return {
            error: 'no match'
        }
    }
    if (staffs.length > 1) {
        console.log(JSON.stringify({staffs}))
        return {
            error: 'multiple matches'
        }
    }
    return staffs[0]
}

module.exports.staffQuery = staffQuery

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
            pipeline: [
                {$lookup: {
                    from: 'institutions',
                    localField: 'affiliations',
                    foreignField: '_id',
                    as: 'affiliations',
                    pipeline: [
                        {$project: {
                            _id: 0,
                            name: 1,
                            code: 1,
                            city: 1,
                            country: 1,
                        }}
                    ]
                }},
            ]
        }},
        ...personRoomAssignmentPipeline(),
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true
        }},
        { $project: {
            _id: 0,
            startDate: 1,
            endDate: 1,
            person: {
                firstName: 1,
                lastName: 1,
                affiliations: 1,
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

module.exports.visitsQuery = visitsQuery
