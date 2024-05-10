const EventSeminar = require('../../models/EventSeminar')
const ObjectId = require('mongoose').Types.ObjectId

const maxDate = new Date(8640000000000000);
const { createSortAndLimitFilters } = require('./common-filters')

/** @param {import('@types/express').Request} req */
async function seminarsQuery(req) {
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
    if (from !== undefined) match.endDateTime={$gte: from}
    if (to !== undefined) match.startDatetime={$lte: to}

    if (req.query.category) {
        match["category"] = ObjectId(req.query.category)
    }

    if (req.query.grant) {
        match["grant"] = ObjectId(req.query.grant)
    }

    if (req.query.externalid) {
        match["externalid"] = req.query.externalid
    }

    const sort_and_limit = createSortAndLimitFilters(req)

    const pipeline = [
        { $match: match },
        ...sort_and_limit,
        { $lookup: {
            from: 'people',
            localField: 'speakers',
            foreignField: '_id',
            as: 'speakers',
            pipeline: [
                {$sort: { 'lastName': 1 }},
                {$lookup: {
                    from: 'institutions',
                    localField: 'affiliations',
                    foreignField: '_id',
                    as: 'affiliations'
                }},
                {$project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    affiliations: 1,
                }}
            ]
        }},
        {$lookup: {
            from: 'seminarcategories',
            localField: 'category',
            foreignField: '_id',
            as: 'category',
            pipeline: [
                {$project: {
                    _id: 1,
                    name: 1,
                    label: 1,
                }}
            ]
        }},
        { $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'conferencerooms',
            localField: 'conferenceRoom',
            foreignField: '_id',
            as: 'conferenceRoom',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                }}
            ]
        }},
        { $unwind: {
            path: '$conferenceRoom',
            preserveNullAndEmptyArrays: true
        }},
        ...sort_and_limit,
        { $project: {
            _id: 1,
            title: 1,
            startDatetime: 1,
            conferenceRoom: 1,
            category: 1,
            duration: 1,
            speakers: 1,
            abstract: 1,
            externalid: 1
        }},
        /*backward compatibility when only single speaker supported*/
        { $addFields: {
            speaker: {
                $arrayElemAt: ["$speakers", 0]
            }
        }}
    ]

    const seminars = await EventSeminar.aggregate(pipeline)

    return {
        data: seminars
    }
}

module.exports = seminarsQuery
