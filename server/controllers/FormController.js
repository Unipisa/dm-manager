const Form = require('../models/Form')
const Controller = require('./Controller')

class FormController extends Controller {
    constructor() {
        super(Form)
        this.path = 'form'
        this.managerRoles.push('form-manager')
        this.supervisorRoles.push('form-manager', 'form-supervisor')
        this.searchFields = [ 'name', 'text' ]
    }

    putFill(req, res) {
        const id = req.params.id
        const user = req.user
        const form = this.Model.findById(id)
    }

    register(router) {
        return [
            ...super.register(router),
            this.register_path(router, 'put', `/${this.path}/:id/fill`,
                null, // require user
                (req, res) => this.putFill(req, res)),
        ]
    }
}

// the controller is included in: server/api.js

module.exports = FormController
