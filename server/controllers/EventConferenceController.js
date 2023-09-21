const { EventConference } = require('../models/Event.js')
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
            'startDate',
            'endDate',
            'room.code',
            'notes',
        ]
    }
}

module.exports = EventConferenceController
