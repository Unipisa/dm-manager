const Url = require('../models/Url')
const Controller = require('./Controller')

class UrlController extends Controller {
    constructor() {
        super(Url)
        this.path = 'url'
        this.searchFields = [ 'url', 'ref' ]
        this.managerRoles.push('url-manager')
        this.supervisorRoles.push('url-manager', 'url-supervisor')
    }
}

module.exports = UrlController
