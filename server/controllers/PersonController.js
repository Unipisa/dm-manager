const Person = require('../models/Person')
const Staff = require('../models/Staff')
const Controller = require('./Controller')

PERSON_SEARCH_ROLES = [
    'person-manager', 
    'person-supervisor', 
    'visit-manager', 
    'grant-manager']

class PersonController extends Controller {
    constructor() {
        super(Person)
        this.path = 'person'
        this.managerRoles.push('person-manager')
        this.supervisorRoles.push('person-manager', 'person-supervisor')
        this.searchFields = [ 'lastName', 'firstName', 'email', 'affiliations.name', 'notes' ]
        this.searchRoles.push(...PERSON_SEARCH_ROLES)
        this.queryPipeline.push(...Staff.personStaffPipeline())
        this.indexPipeline = [{
            $lookup: {
                from: "institutions",
                localField: "affiliations",
                foreignField: "_id",
                as: "affiliations",
                pipeline:[{$project:{name : 1}}]
            }
        }]
    }
}

module.exports = PersonController
module.exports.PERSON_SEARCH_ROLES = PERSON_SEARCH_ROLES