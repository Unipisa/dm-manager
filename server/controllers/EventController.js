const Event = require('../models/Event')
const Controller = require('./Controller')

class EventController extends Controller {
    constructor() {
        super(Event)
        this.path = 'event'
        this.managerRoles.push('event-manager')
        this.supervisorRoles.push('event-manager', 'event-supervisor')
        this.searchFields = [ 'title' ]
    }
}

module.exports = EventController
