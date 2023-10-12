const EventColloquium = require('../models/EventColloquium.js')
const Controller = require('./Controller.js')

class EventColloquiumController extends Controller {
    constructor() {
        super(EventColloquium)
        this.path = 'event-colloquium'
        this.managerRoles.push('event-colloquium-manager')
        this.supervisorRoles.push('event-colloquium-manager', 'event-colloquium-supervisor')

        this.searchFields = [
            'title', 
            'startDatetime',
            'notes',
        ]
    }
}

module.exports = EventColloquiumController
