const { personProfilePipeline } = require('./person-profile')
const Grant = require('../../models/Grant')
const Controller = require('../Controller')

const { createSortAndLimitFilters } = require('./common-filters')

const shortcodeController = new Controller()
shortcodeController.Model = Grant
shortcodeController.path = 'public/grants'
shortcodeController.fields = Object.fromEntries([
    'name', 'identifier', 'CUP', 'projectType', 'funds', 'fundingEntity',
    'pi', 'localCoordinator', 'members', 'startDate', 'endDate', 'SSD',
    'webSite', 'budgetAmount', 'description',
].map(field => [field, Grant._schema_info.properties[field]]))
shortcodeController.searchFields = ['name', 'pi.lastName', 'localCoordinator.lastName']

async function grantsQuery(req, res) {
    const shortcode = req.query._format === 'shortcode'
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

    const sort_and_limit = shortcode ? [] : createSortAndLimitFilters(req)

    const pipeline = [
        { $match: match },
        { $lookup: {
            from: 'people',
            localField: 'pi',
            foreignField: '_id',
            as: 'pi',
            pipeline: personProfilePipeline(),
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
                ...(shortcode ? [{ $project: { _id: 0, isInternal: 1 } }] : []),
            ]
        }},
        { $lookup: {
            from: 'people',
            localField: 'localCoordinator',
            foreignField: '_id',
            as: 'localCoordinator',
            pipeline: personProfilePipeline(),
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
                ...(shortcode ? [{ $project: { _id: 0, isInternal: 1 } }] : []),
            ]
        }},
        ...(shortcode ? ['pi', 'localCoordinator'].map(field => ({ $lookup: {
            from: 'institutions',
            localField: `${field}.affiliations`,
            foreignField: '_id',
            as: `${field}.affiliations`,
            pipeline: [{ $project: { _id: 1, name: 1 } }],
        } })) : []),
        ...sort_and_limit,
        { $project: {
            _id: 1, 
            name: 1, 
            projectType: 1,
            fundingEntity: 1, 
            pi: {
                _id: 1,
                hasPersonProfile: 1,
                firstName: 1,
                lastName: 1,
                ...(shortcode ? { staffs: '$pi.staff', affiliations: { _id: 1, name: 1 } } : {}),
                staff: {
                    qualification: 1,
                    isInternal: 1
                }
            },
            localCoordinator: {
                _id: 1,
                hasPersonProfile: 1,
                firstName: 1,
                lastName: 1,
                ...(shortcode ? { staffs: '$localCoordinator.staff', affiliations: { _id: 1, name: 1 } } : {}),
                staff: {
                    qualification: 1,
                    isInternal: 1
                }
            },
            startDate: 1, 
            endDate: 1, 
            webSite: 1,
            budgetAmount: 1,
            ...(shortcode ? { SSD: 1, funds: 1, identifier: 1, CUP: 1, members: 1, description: 1 } : {}),
        }},
        ...(shortcode ? [{ $set: Object.fromEntries(['pi', 'localCoordinator'].map(field => [field, {
            $cond: [{ $ifNull: [`$${field}._id`, false] }, `$${field}`, null],
        }])) }] : []),
    ]

    if (shortcode) {
        const { _format, ...query } = req.query
        return shortcodeController.performQuery({ _sort: 'startDate', ...query }, res, {
            queryPipeline: pipeline.slice(1),
        })
    }

    const grants = await Grant.aggregate(pipeline)

    return {
        data: grants
    }
}

module.exports = grantsQuery
