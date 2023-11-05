const EventSeminar = require('../../models/EventSeminar')

const maxDate = new Date(8640000000000000);

/** @param {import('@types/express').Request} req */
async function seminarsQuery(req) {
    const from = req.query.from ? new Date(req.query.from) : new Date()
    const to = req.query.to ? new Date(req.query.to) : maxDate

    const pipeline = [
        { $match: {
            startDatetime: { 
                $gte: from,
                $lt: to,
            },
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
