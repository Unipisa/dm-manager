const Grant = require('../../models/Grant')
const ObjectId = require('mongoose').Types.ObjectId

async function grantQuery(req) {
    const id = req.params.id
    const pipeline = [
        { $match: {
            _id: new ObjectId(id),
        }},
        { $lookup: {
            from: 'people',
            localField: 'pi',
            foreignField: '_id',
            as: 'pi',
        }},
        { $unwind: {
            path: '$pi',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'institutions',
            localField: 'pi.affiliations',
            foreignField: '_id',
            as: 'pi.affiliations',
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
        {$lookup: {
            from: 'staffs',
            localField: 'pi._id',
            foreignField: 'person',
            as: 'pi.staff',
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
            from: 'people',
            localField: 'localCoordinator',
            foreignField: '_id',
            as: 'localCoordinator',
        }},
        { $unwind: {
            path: '$localCoordinator',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'institutions',
            localField: 'localCoordinator.affiliations',
            foreignField: '_id',
            as: 'localCoordinator.affiliations',
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
        {$lookup: {
            from: 'staffs',
            localField: 'localCoordinator._id',
            foreignField: 'person',
            as: 'localCoordinator.staff',
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
            from: 'people',
            localField: 'members',
            foreignField: '_id',
            as: 'members',
        }},
        { $addFields: { 
            members: { 
                $ifNull: ["$members", []] 
            } 
        }},
        { $project: {
            _id: 1, 
            name: 1, 
            projectType: 1,
            fundingEntity: 1, 
            pi: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                affiliations: {
                    name: 1
                },
                staff: {
                    qualification: 1,
                    isInternal: 1
                }
            },
            localCoordinator: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                affiliations: {
                    name: 1
                },
                staff: {
                    qualification: 1,
                    isInternal: 1
                }
            },
            members: {
                _id: 1,
                firstName: 1,
                lastName: 1
            },
            startDate: 1, 
            endDate: 1, 
            webSite: 1,
            budgetAmount: 1, 
            description: 1
        }}
    ]

    const grant = await Grant.aggregate(pipeline)

    return {
        data: grant
    }
}


module.exports = grantQuery