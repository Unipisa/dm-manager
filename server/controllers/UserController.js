const User = require('../models/User')
const Controller = require('./Controller')

class UserController extends Controller {
    constructor() {
        super(User)
        this.path = 'user'
        this.populateFields = []
        this.fields.lastName.match_regex = true
        this.searchFields = [ 'username', 'email', 'firstName', 'lastName' ]
    }
}

module.exports = UserController