const RoomLabel = require('../models/RoomLabel')
const Controller = require('./Controller')

class RoomLabelController extends Controller {
    constructor() {
        super()
        this.path = 'roomLabel'
        this.managerRoles.push('room-manager')
        this.supervisorRoles.push('room-manager', 'room-supervisor')
        this.Model = RoomLabel
    }
}

module.exports = RoomLabelController