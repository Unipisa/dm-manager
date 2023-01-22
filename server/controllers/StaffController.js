const Staff = require('../models/Staff')
const Controller = require('./Controller')
const RoomAssignment = require('../models/RoomAssignment')

class StaffController extends Controller {
    constructor() {
        super(Staff)
        this.path = 'staff'
        this.managerRoles.push('staff-manager')
        this.supervisorRoles.push('staff-manager', 'staff-supervisor')
        this.searchFields = [ 'person.lastName', 'person.firstName']

        // inserisce tutte le assegnazioni
        // stanze
        this.queryPipeline.push(...RoomAssignment.personRoomAssignmentPipeline())
    }
}

module.exports = StaffController
