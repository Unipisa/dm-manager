const Person = require("../../models/Person")
const ObjectId = require('mongoose').Types.ObjectId

/** @param {import('@types/express').Request} req */
async function personQuery(req, res) {
    let _id = undefined;
    try {
        _id = new ObjectId(req.params.id)
    } catch {
        res.status(404).json({ 
            error: 'person not found'
        })
        return
    }

    const pipeline = [
        { $match: { _id } },        
        {$lookup: {
            from: 'institutions',
            localField: 'affiliations',
            foreignField: '_id',
            as: 'affiliations'
        }},
        {$lookup: {
            from: 'staffs',
            localField: '_id',
            foreignField: 'person', 
            as: 'staffs',
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
        }},
        { $lookup: {
            from: 'roomassignments',
            localField: '_id',
            foreignField: 'person',
            as: 'roomAssignments',
            pipeline: [
                { $match: {
                    $expr: {
                        $and: [
                            { $or: [
                                { $eq: ["$endDate", null] },
                                { $gte: ["$endDate", "$$NOW"] } 
                            ]},
                            { $or: [
                                { $eq: ["$startDate", null] },
                                { $lte: ["$startDate", "$$NOW"] } 
                            ]}
                        ]
                    }
                }},
                { $lookup: {
                    from: 'rooms',
                    localField: 'room',
                    foreignField: '_id',
                    as: 'roomDetails'
                }},
                { $unwind: {
                    path: "$roomDetails",
                    preserveNullAndEmptyArrays: true
                }},
                { $project: {
                    room: 1,
                    startDate: 1,
                    endDate: 1,
                    roomDetails: {
                        building: 1,
                        floor: 1,
                        number: 1,
                        code: 1
                    }
                }}
            ]
        }},
        {$lookup: {
            from: 'groups',
            as: 'groups',
            let: { person_id: '$_id' },
            pipeline: [
                { $match: { $expr: {
                    $and: [
                        { $or: [ 
                            { $eq: [ "$$person_id", "$chair" ] },
                            { $eq: [ "$$person_id", "$vice" ] },
                            { $in: [ "$$person_id", "$members" ] }
                        ]},
                        { $or: [
                            { $eq: ["$endDate", null] },
                            { $gte: ["$endDate", "$$NOW"] } ]},
                        { $or: [
                            { $eq: ["$startDate", null] },
                            { $lte: ["$startDate", "$$NOW"] } ]}
                    ]}}                 
                }
            ]
        }},
        {
            $project: {
                firstName: 1, 
                lastName: 1,
                affiliations: {
                    _id: 1,
                    name: 1,
                }, 
                gender: 1, 
                email: 1, 
                phone: 1, 
                personalPage: 1, 
                google_scholar: 1, 
                orcid: 1, 
                mathscinet: 1,
                arxiv_orcid: 1,
                photoUrl: 1,
                staffs: {
                    qualification: 1,
                    SSD: 1,
                    isInternal: 1
                },
                roomAssignments: {
                    room: 1,
                    startDate: 1,
                    endDate: 1,
                    roomDetails: {
                        building: 1,
                        floor: 1,
                        number: 1,
                        code: 1
                    }
                },
                groups: {
                    name: 1, 
                    chair: 1,
                    vice: 1
                }
            }
        }
    ]

    const response = await Person.aggregate(pipeline)
    
    if (response.length == 0) {
        res.status(404).json({ 
            error: 'person not found'
        })
        return
    }

    res.json({
        data: response[0]
    })
}

module.exports = personQuery