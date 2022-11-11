const User = require('../models/User')
const Controller = require('./Controller')

class UserController extends Controller {
    constructor() {
        super(User)
        this.path = 'user'
        this.populate_fields = []
    }
}

module.exports = UserController