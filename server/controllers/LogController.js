const { withToken } = require('react-bootstrap-typeahead')
const Log = require('../models/Log')
const Controller = require('./Controller')
const { hasSomeRole, requireSomeRole, requireUser } = require('./middleware')

class LogController extends Controller {
    constructor() {
        super(Log)
        this.path = 'log'
        this.Model = Log
        this.supervisorRoles = ['admin']
        this.managerRoles = []
        this.searchFields = ['when', 'who', 'what', 'where']
    }
}

module.exports = LogController