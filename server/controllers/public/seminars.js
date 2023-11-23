const EventSeminar = require('../../models/EventSeminar')
const ObjectId = require('mongoose').Types.ObjectId

const maxDate = new Date(8640000000000000);

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

    var startDatetime = {}
    if (from !== undefined) {
        startDatetime["$gte"] = from
    }
    if (to !== undefined) {
        startDatetime["$lte"] = to
    }

    var match = {}

    if (Object.keys(startDatetime).length > 0) {
        match.startDatetime = startDatetime
    }

    if (req.query.category) {
        match["category"] = ObjectId(req.query.category)
    }

    if (req.query.grant) {
        match["grant"] = ObjectId(req.query.grant)
    }

    if (req.query.externalid) {
        match["externalid"] = req.query.externalid
    }

    const pipeline = [
        { $match: match },
        { $lookup: {
            from: 'people',
            localField: 'speaker',
            foreignField: '_id',
            as: 'speaker',
        }},
        { $unwind: {
            path: '$speaker',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'institutions',
            localField: 'speaker.affiliations',
            foreignField: '_id',
            as: 'speaker.affiliations',
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
        { $limit: req.params._limit ?? 50 }, 
        { $project: {
            _id: 1,
            title: 1,
            startDatetime: 1,
            conferenceRoom: 1,
            category: 1,
            duration: 1,
            speaker: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                affiliations: 1,
            },
            abstract: 1,
            externalid: 1
        }}
    ]

    const seminars = await EventSeminar.aggregate(pipeline)

    return {
        data: seminars
    }
}

module.exports = seminarsQuery
