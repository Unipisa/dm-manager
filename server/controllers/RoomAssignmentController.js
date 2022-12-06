const RoomAssignment = require('../models/RoomAssignment')
const Controller = require('./Controller')

class RoomAssignmentController extends Controller {
    constructor() {
        super(RoomAssignment)
        this.path = 'roomAssignment'
        this.managerRoles.push('assignment-manager')
        this.supervisorRoles.push('assignment-manager', 'assignment-supervisor')
    }
}

module.exports = RoomAssignmentController