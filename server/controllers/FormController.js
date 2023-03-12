const Form = require('../models/Form')
const FormData = require('../models/FormData')
const Group = require('../models/Group')
const Controller = require('./Controller')
const { log } = require('./middleware')

async function getFormAndCheckAccess(req, res) {
    const id = req.params.id
    try {
        const obj = await Form
            .findById(id)
        if (obj === null) {
            res.status(404).send({error: `not found ${id}`})
            return null
        }
        if ((obj.requireUser || obj.restrictedGroup) && !req.user) {
            res.status(401).send({error: `user required`})
            return null
        }
        if (obj.restrictedGroup) {
            const group = await Group.findById(obj.restrictedGroup)
            if (!group) {
                res.status(404).send({error: `group not found`})
                return null
            }
            if (!group.users.includes(req.user._id)) {
                res.status(403).send({error: `user not authorized`})
                return null 
            }
        }
        today = new Date()
        if ((obj.startDate && obj.startDate > today) || 
            (obj.endDate && obj.endDate < today)) {
            if (req.method === 'GET') {
                return {_id: obj._id, name: obj.name, closed: true, text: "form closed"}
            } else {
                res.status(403).send({error: `form closed`})
                return null
            }
        }
        return obj
    } catch(error) {
        console.log(`invalid _id: ${id}`)
        res.status(400).send({error: `invalid id ${id}`})
        return null
    }
}

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
        const obj = await getFormAndCheckAccess(req, res)
        if (!obj) return null
        res.send({
            _id: obj._id,
            name: obj.name,
            text: obj.text,
            requireUser: obj.requireUser,
            startDate: obj.startDate,
            endDate: obj.endDate,
            publish: obj.publish,
            closed: obj?.closed,
            canChangeAnswers: obj.canChangeAnswers,
        })
    }

    async putFill(req, res) {
        const form = await getFormAndCheckAccess(req, res)
        if (!form) return null
        const user = req.user
        const map = new Map()
        Object.entries(req.body).forEach(([key, value]) => {
            map.set(key, value)
        })
        const payload = {
            form,
            data: map,
            email: user.email || null,
            lastName: user.lastName || null,
            firstName: user.firstName || null,
            createdBy: user._id,
            updatedBy: user._id,
        }
        const data = new FormData(payload)
        log(req, {}, payload)
        const obj = await data.save()
        return res.send(obj)
    }

    async getData(req, res) {
        const id = req.params.id
        const user = req.user
        const form = await this.Model.findById(id)
        if (!form) return res.status(404).send({error: 'Form not found'})
        if (!req.user.roles.includes('admin') 
            && !form.createdBy._id.equals(user._id)) 
                return res.status(403).send({error: 'Forbidden'})
        return this.performQuery({
            ...req.query,
            form: id,
        }, res, {
            fields: {
                form: {
                    can_sort: true,
                    can_filter: true,
                    match_ids: true,
                }
            },
            Model: FormData,
        })   
    }

    register(router) {
        return [
            ...super.register(router),
            this.register_path(router, 'get', `/${this.fillPath}/:id`,
                false, // no checks, authorization is done in end-point
                (req, res) => this.getFill(req, res)),
            this.register_path(router, 'put', `/${this.fillPath}/:id`,
                false, // no checks, authorization is done in end-point
                (req, res) => this.putFill(req, res)),
            this.register_path(router, 'get', `/${this.path}/:id/data`,
                true, // require user, user should be checked in end-point 
                (req, res) => this.getData(req, res)),
        ]
    }
}

// the controller is included in: server/api.js

module.exports = FormController
