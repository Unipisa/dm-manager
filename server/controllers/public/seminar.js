const EventSeminar = require('../../models/EventSeminar')
const ObjectId = require('mongoose').Types.ObjectId

async function seminarQuery(req) {
    const seminar_id = req.params.id
    const pipeline = [
        { $match: {
            _id: ObjectId(seminar_id),
        }},
        { $lookup: {
            from: 'people',
            localField: 'speakers',
            foreignField: '_id',
            as: 'speakers',
            pipeline: [
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
        {$lookup: {
            from: 'conferencerooms',
            localField: 'conferenceRoom',
            foreignField: '_id',
            as: 'conferenceRoom',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                    room: 1
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
            category: 1,
            speakers: 1,
            abstract: 1,
            externalid: 1
        }}
    ]

    const seminars = await EventSeminar.aggregate(pipeline)

    return {
        data: seminars
    }
}

module.exports = seminarQuery
