const ConferenceRoom = require('../models/ConferenceRoom')
const Controller = require('./Controller')

class ConferenceRoomController extends Controller {
    constructor() {
        super(ConferenceRoom)
        this.path = 'conference-room'
        this.managerRoles.push('conference-room-manager')
        this.supervisorRoles.push('conference-room-manager', 'conference-room-supervisor')
        // this.searchRoles = ['room-manager', 'room-supervisor']
        
        this.searchFields = ['name', 'room.code', 'room.notes']
    }
}

module.exports = ConferenceRoomController