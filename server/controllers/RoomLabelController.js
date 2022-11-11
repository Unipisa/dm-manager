const RoomLabel = require('../models/RoomLabel')
const Controller = require('./Controller')

class RoomLabelController extends Controller {
    constructor() {
        super(RoomLabel)
        this.path = 'roomLabel'
        this.managerRoles.push('room-manager')
        this.supervisorRoles.push('room-manager', 'room-supervisor')
    }
}

module.exports = RoomLabelController