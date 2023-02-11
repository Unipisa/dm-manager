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

        this.fillPath = 'fill'
    }

    async getFill(req, res) {
        const id = req.params.id
        try {
            let obj = await this.Model
                .findById(id)
            if (obj === null) {
                return res.status(404).send({error: `not found ${id}`})
            }
            res.send({
                _id: obj._id,
                name: obj.name,
                text: obj.text,
            })
        } catch(error) {
            console.log(`invalid _id: ${id}`)
            res.status(404).send({error: `invalid id ${id}`})
        }
    }

    async putFill(req, res) {
        const id = req.params.id
        const user = req.user
        try {
            const form = await this.Model.findById(id)
            if (!form) return res.status(404).send({error: 'Form not found'})
            const map = new Map()
            Object.entries(req.body).forEach(([key, value]) => {
                map.set(key, value)
            })
            const data = new FormData({
                form,
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

    async getData(req, res) {
        const id = req.params.id
        const user = req.user
        const form = await this.Model.findById(id)
        if (!form) return res.status(404).send({error: 'Form not found'})
        if (!req.user.roles.includes('admin') 
            && !form.createdBy._id.equals(user._id)) 
                return res.status(403).send({error: 'Forbidden'})
        return this.performQuery(req.query, res, {
            Model: FormData,
        })   
    }

    register(router) {
        return [
            ...super.register(router),
            this.register_path(router, 'get', `/${this.fillPath}/:id`,
                null, // require user
                (req, res) => this.getFill(req, res)),
            this.register_path(router, 'put', `/${this.fillPath}/:id`,
                null, // require user
                (req, res) => this.putFill(req, res)),
            this.register_path(router, 'get', `/${this.path}/:id/data`,
                null, // require user, user will be checked in end-point 
                (req, res) => this.getData(req, res)),
        ]
    }
}

// the controller is included in: server/api.js

module.exports = FormController
