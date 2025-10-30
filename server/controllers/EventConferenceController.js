const EventConference = require('../models/EventConference.js')
const Controller = require('./Controller.js')

class EventConferenceController extends Controller {
    constructor() {
        super(EventConference)
        this.path = 'event-conference'
        this.managerRoles.push('event-conference-manager')
        this.supervisorRoles.push('event-conference-manager', 'event-conference-supervisor')

        this.searchFields = [ 'title', 'startDate', 'endDate', 'SSD', 'organizers.firstName', 'organizers.lastName' ]
        this.indexPipeline = [
            {
                $lookup: {
                    from: "people",
                    localField: "organizers",
                    foreignField: "_id",
                    as: "organizers",
                    pipeline: [
                        { $project: { firstName: 1, lastName: 1 } },
                        { $sort: { lastName: 1 } },
                    ]
                }
            }
        ]
    }
}

module.exports = EventConferenceController
