const Visit = require('../models/Visit')
const Controller = require('./Controller')
const RoomAssignment = require('../models/RoomAssignment')

class VisitController extends Controller {
    constructor() {
        super(Visit)
        this.path = 'visit'
        this.managerRoles.push('visit-manager')
        this.supervisorRoles.push('visit-manager', 'visit-supervisor')
        this.searchFields = [ 'person.lastName', 'person.firstName', 'affiliations.name', 'grants' ]

        // inserisce tutte le assegnazioni
        // stanze
        this.queryPipeline.push(...RoomAssignment.personRoomAssignmentPipeline())
    }
}

module.exports = VisitController
