const Group = require('../models/Group')
const Controller = require('./Controller')

class GroupController extends Controller {
    constructor() {
        super(Group)
        this.path = 'group'
        this.managerRoles.push('group-manager')
        this.supervisorRoles.push('group-manager', 'group-supervisor')
        this.searchFields = [ 'person.lastName', 'person.firstName', 'affiliation' ]
    }
}

module.exports = GroupController
