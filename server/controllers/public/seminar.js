const EventSeminar = require('../../models/EventSeminar')
const ObjectId = require('mongoose').Types.ObjectId

async function seminarQuery(req) {
    const seminar_id = req.params.id
    const pipeline = [
        { $match: {
            // startDatetime: {$gte: new Date()},
            _id: new ObjectId(seminar_id),
        }},
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
            localField: 'affiliations',
            foreignField: '_id',
            as: 'affiliations'
        }},
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
        }}
    ]

    // console.log(JSON.stringify({pipeline}))

    const seminars = await EventSeminar.aggregate(pipeline)

    return {
        data: seminars
    }
}

module.exports = seminarQuery
