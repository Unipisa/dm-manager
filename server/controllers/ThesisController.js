const Thesis = require('../models/Thesis')
const Controller = require('./Controller')

class ThesisController extends Controller {
    constructor() {
        super(Thesis)
        this.path = 'thesis'
        this.managerRoles.push('thesis-manager')
        this.supervisorRoles.push('thesis-manager', 'thesis-supervisor')
        this.searchFields = ['title', 'person.lastName', 'supervisors.lastName']
    }
}

module.exports = ThesisController