const User = require('../models/User')
const Controller = require('./Controller')

class UserController extends Controller {
    constructor() {
        super()
        this.path = 'user'
        this.Model = User
        this.populate_fields = []
        this.fields = {
            createdAt: {
                can_sort: true,
            },
            updatedAt: {
                can_sort: true,
            },
            lastName: {
                can_sort: true,
                can_filter: true,
            },
            firstName: {
                can_sort: true,
                can_filter: true,
            },
            username: {
                can_sort: true,
                can_filter: true,
            },
            email: {
                can_sort: true,
                can_filter: true,
            },
            roles: {
            }
        }
    }
}

module.exports = UserController