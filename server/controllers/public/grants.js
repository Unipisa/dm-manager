const ObjectId = require('mongoose').Types.ObjectId
const Grant = require('../../models/Grant')

const { createSortAndLimitFilters } = require('./common-filters')

async function grantsQuery(req) {
    var from = undefined;
    switch (req.query.from) {
        case 'now':
            from = new Date()
            break;
        case undefined:
            from = undefined
            break;
        default:
            from = new Date(req.query.from)
    }

    var to = undefined;
    switch (req.query.to) {
        case 'now':
            to = new Date()
            break;
        case undefined:
            to = undefined
            break;
        default:
            to = new Date(req.query.to)
    }

    var match = {}

    if (from !== undefined) {
        match["endDate"] = { "$gte": from }
    }
    if (to !== undefined) {
        match["startDate"] = { "$lte": to }
    }

    if (req.query.ssd) {
        // SSD is now an array; MongoDB will match if the array contains this value
        match["SSD"] = req.query.ssd
    }

    const sort_and_limit = createSortAndLimitFilters(req)

    const pipeline = [
        { $match: match },
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
        ...sort_and_limit,
        { $project: {
            _id: 1, 
            name: 1, 
            projectType: 1,
            fundingEntity: 1, 
            pi: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                staff: {
                    qualification: 1,
                    isInternal: 1
                }
            },
            localCoordinator: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                staff: {
                    qualification: 1,
                    isInternal: 1
                }
            },
            startDate: 1, 
            endDate: 1, 
            webSite: 1,
            budgetAmount: 1
        }}
    ]

    const grants = await Grant.aggregate(pipeline)

    return {
        data: grants
    }
}

module.exports = grantsQuery
