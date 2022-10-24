const User = require('../models/User')
const Controller = require('./Controller')

class UserController extends Controller {
    constructor() {
        super()
        this.path = 'user'
        this.Model = User
        this.populate_fields = []
    }
}

module.exports = UserController