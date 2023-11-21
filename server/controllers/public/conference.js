const EventConference = require('../../models/EventConference')
const ObjectId = require('mongoose').Types.ObjectId

async function conferenceQuery(req) {
    const id = req.params.id
    const pipeline = [
        { $match: {
            _id: new ObjectId(id),
        }},
    ]

    const conference = await EventConference.aggregate(pipeline)

    return {
        data: conference
    }
}


module.exports = conferenceQuery