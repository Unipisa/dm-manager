const ObjectId = require('mongoose').Types.ObjectId
const EventConference = require('../../models/EventConference')

const maxDate = new Date(8640000000000000);

async function conferencesQuery(req) {
    const from = req.query.from ? new Date(req.query.from) : new Date()
    const to = req.query.to ? new Date(req.query.to) : maxDate

    var match = {
        startDate: {
            $gte: from,
            $lt: to,
        },
    }

    if (req.query.grant) {
        match["grant"] = ObjectId(req.query.grant)
    }

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
        { $project: {
            _id: 1, 
            title: 1, 
            startDate: 1,
            endDate: 1,
            SSD: 1,
            url: 1,
            conferenceRoom: 1,
            notes: 1
        }}
    ]

    const conferences = await EventConference.aggregate(pipeline)

    return {
        data: conferences
    }
}

module.exports = conferencesQuery