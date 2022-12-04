const RoomLabel = require('../models/RoomLabel')
const Controller = require('./Controller')

class RoomLabelController extends Controller {
    constructor() {
        super(RoomLabel)
        this.path = 'roomLabel'
        this.managerRoles.push('label-manager')
        this.supervisorRoles.push('label-manager', 'label-supervisor')
    }
}

module.exports = RoomLabelController