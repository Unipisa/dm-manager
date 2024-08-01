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

    if (req.query.grants) {
        match["grants"] = ObjectId(req.query.grants)
    }

    if (req.query.ssd) {
        match["SSD"] = req.query.ssd
    }

    if (req.query.is_outreach !== undefined) {
        match["isOutreach"] = req.query.is_outreach === 'true'
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
            localField: 'grants',
            as: 'grants'
        }},
        { $lookup: {
            from: 'institutions',
            foreignField: '_id',
            localField: 'institution',
            as: 'institution'
        }},
        { $unwind: {
            path: '$institution',
            preserveNullAndEmptyArrays: true
        }},
        ...sort_and_limit,
        { $project: {
            _id: 1, 
            title: 1, 
            startDate: 1,
            endDate: 1,
            SSD: 1,
            isOutreach: 1,
            grants:  {
                _id: 1,
                name: 1, 
                identifier: 1,
            },
            url: 1,
            conferenceRoom: 1,
            institution: {
                _id: 1,
                name: 1
            },
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
