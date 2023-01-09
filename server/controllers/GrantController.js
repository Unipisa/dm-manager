const Grant = require('../models/Grant')
const Controller = require('./Controller')

class GrantController extends Controller {
    constructor() {
        super(Grant)
        this.path = 'grant'
        this.managerRoles.push('grant-manager')
        this.supervisorRoles.push('grant-manager', 'grant-supervisor')
        this.searchFields = ['identifier', 'description']
    }
}

module.exports = GrantController