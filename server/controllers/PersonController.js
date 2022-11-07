const Visit = require('../models/Person')
const Controller = require('./Controller')

class PersonController extends Controller {
    constructor() {
        super()
        this.path = 'person'
        this.managerRoles.push('person-manager')
        this.supervisorRoles.push('person-manager', 'person-supervisor')
        this.Model = Visit
        this.fields = {
            'lastName': {
                can_sort: true,
                can_filter: true,
            },
            'firstName': {
                can_sort: true,
                can_filter: true,
            },
            'updatedAt': {
                can_sort: true,
            },
            'createdAt': {
                can_sort: true,
            },
        }
    }
}

module.exports = PersonController