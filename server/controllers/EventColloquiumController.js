const { EventColloquium } = require('../models/Event.js')
const Controller = require('./Controller.js')

class EventColloquiumController extends Controller {
    constructor() {
        super(EventColloquium)
        this.path = 'event-colloquium'
        this.managerRoles.push('event-colloquium-manager')
        this.supervisorRoles.push('event-colloquium-manager', 'event-colloquium-supervisor')

        this.searchFields = [
            'title', 
            'startDate',
            'notes',
        ]
    }
}

module.exports = EventColloquiumController
