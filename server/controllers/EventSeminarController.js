const EventSeminar = require('../models/EventSeminar.js')
const Controller = require('./Controller.js')

class EventSeminarController extends Controller {
    constructor() {
        super(EventSeminar)
        this.path = 'event-seminar'
        this.managerRoles.push('event-seminar-manager')
        this.supervisorRoles.push('event-seminar-manager', 'event-seminar-supervisor')

        this.searchFields = ['title', 'startDatetime', 'abstract', 'room.code', 'speaker.firstName', 'speaker.lastName']
    }
}

module.exports = EventSeminarController
