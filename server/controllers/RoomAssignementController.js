const RoomAssignement = require('../models/RoomAssignement')
const Controller = require('./Controller')

class RoomAssignementController extends Controller {
    constructor() {
        super(RoomAssignement)
        this.path = 'roomAssignement'
        this.managerRoles.push('assignement-manager')
        this.supervisorRoles.push('assignement-manager', 'assignement-supervisor')
    }
}

module.exports = RoomAssignementController