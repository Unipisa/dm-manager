const Form = require('../models/Form')
const FormData = require('../models/FormData')
const Controller = require('./Controller')

class FormController extends Controller {
    constructor() {
        super(Form)
        this.path = 'form'
        this.managerRoles.push('form-manager')
        this.supervisorRoles.push('form-manager', 'form-supervisor')
        this.searchFields = [ 'name', 'text' ]
    }

    async putFill(req, res) {
        const id = req.params.id
        const user = req.user
        const form = await this.Model.findById(id)
        if (!form) return res.status(404).send({error: 'Form not found'})
        const map = new Map()
        Object.entries(req.body).forEach(([key, value]) => {
            map.set(key, value)
        })
        try {
            const data = new FormData({
                data: map,
                email: user.email || null,
                lastName: user.lastName || null,
                firstName: user.firstName || null,
                createdBy: user._id,
                updatedBy: user._id,
            })
            const obj = await data.save()
            return res.send(obj)
        } catch (err) {
            return res.status(400).send({error: err.message})
        }
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
