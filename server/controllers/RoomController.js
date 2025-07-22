const Room = require('../models/Room')
const RoomAssignment = require('../models/RoomAssignment')
const Controller = require('./Controller')

class RoomController extends Controller {
    constructor() {
        super(Room)
        this.path = 'room'
        this.managerRoles.push('room-manager')
        this.supervisorRoles.push('room-manager', 'room-supervisor', 'assignment-manager', 'assignment-supervisor')
        this.searchFields = ['code', 'notes', 'description', 'roomAssignments.person.lastName', 'roomAssignments.person.firstName']
        this.searchRoles = ['room-manager', 'room-supervisor', 'assignment-manager']

        // inserisce le assegnazioni
        this.queryPipeline.push(
            // inserisce startDate e endDate con la data odierna
            {$addFields: {
                startDate: "$$NOW",
                endDate: "$$NOW",
            }},
            ...RoomAssignment.roomRoomAssignmentPipeline()
        ) 
    }
}

module.exports = RoomController