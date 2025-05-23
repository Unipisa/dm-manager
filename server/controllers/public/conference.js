const EventConference = require('../../models/EventConference')
const ObjectId = require('mongoose').Types.ObjectId

async function conferenceQuery(req) {
    const id = req.params.id
    const pipeline = [
        { $match: {
            _id: new ObjectId(id),
        }},
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
        { $project: {
            _id: 1, 
            title: 1, 
            startDate: 1,
            endDate: 1,
            SSD: 1,
            url: 1,
            isOutreach: 1,
            grants: {
                _id: 1,
                name: 1, 
                identifier: 1,
            }, 
            description: 1, 
            conferenceRoom: {
                _id: 1, 
                name: 1,
                room: 1
            },
            url: 1
        }}
    ]

    const conference = await EventConference.aggregate(pipeline)

    return {
        data: conference
    }
}


module.exports = conferenceQuery