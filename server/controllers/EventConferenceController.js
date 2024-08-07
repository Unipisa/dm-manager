const EventConference = require('../models/EventConference.js')
const Controller = require('./Controller.js')

class EventConferenceController extends Controller {
    constructor() {
        super(EventConference)
        this.path = 'event-conference'
        this.managerRoles.push('event-conference-manager')
        this.supervisorRoles.push('event-conference-manager', 'event-conference-supervisor')

        this.searchFields = [
            'title', 
            'url',
            'startDatetime',
            'endDate',
            'room.code',
            'notes',
        ]
    }
}

module.exports = EventConferenceController
