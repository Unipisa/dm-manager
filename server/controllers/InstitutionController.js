const Institution = require('../models/Institution')
const Controller = require('./Controller')
const PERSON_SEARCH_ROLES = require('./PersonController').PERSON_SEARCH_ROLES

class InstitutionController extends Controller {
    constructor() {
        super(Institution)
        this.path = 'institution'
        this.managerRoles.push('institution-manager')
        this.supervisorRoles.push('institution-manager', 'institution-supervisor')
        this.searchFields = ['name', 'country', 'city', 'notes']
        this.searchRoles.push(...PERSON_SEARCH_ROLES)
    }
}

module.exports = InstitutionController