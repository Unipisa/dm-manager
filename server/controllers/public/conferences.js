const ObjectId = require('mongoose').Types.ObjectId
const EventConference = require('../../models/EventConference')

const maxDate = new Date(8640000000000000);
const { createSortAndLimitFilters } = require('./common-filters')

async function conferencesQuery(req) {
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

    if (req.query.grant) {
        match["grant"] = ObjectId(req.query.grant)
    }

    if (req.query.SSD) {
        match["SSD"] = req.query.SSD
    }

    const sort_and_limit = createSortAndLimitFilters(req)

    const pipeline = [
        { $match: match },
        { $lookup: {
            from: 'conferencerooms',
            foreignField: '_id',
            localField: 'conferenceRoom',
            as: 'conferenceRoom'
        }},
        { $unwind: {
            path: '$conferenceRoom',
            preserveNullAndEmptyArrays: true
        }},
        { $lookup: {
            from: 'grants',
            foreignField: '_id',
            localField: 'grant',
            as: 'grant'
        }},
        ...sort_and_limit, 
        { $project: {
            _id: 1, 
            title: 1, 
            startDate: 1,
            endDate: 1,
            SSD: 1,
            url: 1,
            conferenceRoom: 1,
            description: 1,
            url: 1
        }}
    ]

    const conferences = await EventConference.aggregate(pipeline)

    return {
        data: conferences
    }
}

module.exports = conferencesQuery