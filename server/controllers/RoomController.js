const Room = require('../models/Room')
const Controller = require('./Controller')

class RoomController extends Controller {
    constructor() {
        super(Room)
        this.path = 'room'
        this.managerRoles.push('room-manager')
        this.supervisorRoles.push('room-manager', 'room-supervisor', 'assignment-manager', 'assignment-supervisor')
        this.searchFields = ['code', 'notes']
        this.searchRoles = ['room-manager', 'room-supervisor', 'assignment-manager']
    }
}

module.exports = RoomController