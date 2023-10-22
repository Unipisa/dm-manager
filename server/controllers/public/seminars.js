const EventSeminar = require('../../models/EventSeminar')

async function seminarsQuery(req) {
    const pipeline = [
        { $match: {
            startDatetime: {$gte: new Date()}
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
        }}
    ]

    // console.log(JSON.stringify({pipeline}))

    const seminars = await EventSeminar.aggregate(pipeline)

    return seminars
}

module.exports = seminarsQuery
