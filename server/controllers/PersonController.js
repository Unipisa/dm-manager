const Person = require('../models/Person')
const Controller = require('./Controller')

class PersonController extends Controller {
    constructor() {
        super(Person)
        this.path = 'person'
        this.managerRoles.push('person-manager')
        this.supervisorRoles.push('person-manager', 'person-supervisor')
    }
}

module.exports = PersonController