const Person = require('../models/Person')
const Controller = require('./Controller')
const { ObjectId } = require('mongoose').Types

class PersonController extends Controller {
    constructor() {
        super(Person)
        this.path = 'person'
        this.managerRoles.push('person-manager')
        this.supervisorRoles.push('person-manager', 'person-supervisor')
        this.searchFields = [ 'lastName', 'firstName', 'affiliation' ]
        this.searchRoles.push('person-manager', 'person-supervisor', 'visit-manager', 'grant-manager')
    }
}

module.exports = PersonController