const Room = require('../models/Room')
const Controller = require('./Controller')

class RoomController extends Controller {
    constructor() {
        super(Room)
        this.path = 'room'
        this.managerRoles.push('room-manager')
        this.supervisorRoles.push('room-manager', 'room-supervisor')
        this.searchFields = ['number', 'floor', 'building']
    }
}

module.exports = RoomController