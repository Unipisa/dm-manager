const Visit = require('../models/Visit')
const Controller = require('./Controller')

class VisitController extends Controller {
    constructor() {
        super(Visit)
        this.path = 'visit'
        this.populate_fields = [
            {path: 'person', select: ['firstName', 'lastName', 'affiliation', 'email']},
            {path: 'referencePerson', select: ['firstName', 'lastName', 'affiliation', 'email']},
        ]
        this.managerRoles.push('visit-manager')
        this.supervisorRoles.push('visit-manager', 'visit-supervisor')
    }
}

module.exports = VisitController