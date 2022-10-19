const {log, requireSomeRole} = require('./middleware') 

class Controller {
    constructor() {
        this.path = null
        this.managerRoles = ['admin']
        this.supervisorRoles = ['admin', 'supervisor']
        this.Model = null
    }

    async get(req, res, id) {
        try {
            let obj = await this.Model.findById(id)
            res.send(obj)
        } catch(error) {
            console.error(error)
            res.status(404).send({error: error.message})
        }
    }

    async index(req, res) {
        let data = await this.Model.find()
        res.send({data})
    }

    async put(req, res) {
        let payload = {
            ...req.body,
            createdBy: req.user._id,
            updatedBy: req.user._id,
        }
        delete payload.createdAt
        delete payload.updatedAt
    
        try {
            log(req, {}, payload)
            const obj = await this.Model.create(payload)
            res.send(obj)
        } catch(err) {
            console.error(err)
            res.status(400).send({ error: err.message })
        }
    }

    async patch(req, res, id, payload) {    
        console.log(`***PATCH ${id} ${JSON.stringify(payload)}`)
        try {
            const was = await this.Model.findById(id)
            log(req, was, payload)
            const obj = await this.Model.findByIdAndUpdate(id, payload)
            res.send(obj)
        } catch(error) {
            console.error(error)
            res.status(400).send({error: err.message})
        }
    }

    async delete(req, res, id) {
        try {
            const obj = await this.Model.findById(id)
            log(req, obj, {})
            obj.delete()
            res.send({})
        } catch(err) {
            console.error(err)
            res.status(400).send({ error: err.message })
        }
    }

    register(router) {
        router.get(`/${this.path}/:id`, 
            requireSomeRole(...this.managerRoles), 
            (req, res) => {
                this.get(req, res, req.params.id)
            })
        
        router.get(`/${this.path}`, 
            requireSomeRole(...this.supervisorRoles), 
            (req, res) => this.index(req, res))            
            
        router.put(`/${this.path}`, 
            requireSomeRole(...this.managerRoles), 
            (req, res) => this.put(req, res))

        router.patch(`/${this.path}/:id`, 
            requireSomeRole(...this.managerRoles), 
            (req, res) => {
                console.log("BUH")
                const payload = {...req.body,
                    updatedBy: req.user._id
                }
                delete payload.createdBy
                delete payload.createdAt
                delete payload.updatedAt
                this.patch(req, res, req.params.id, payload)
            })

        router.delete(`/${this.path}/:id`, 
            requireSomeRole(...this.managerRoles), 
            (req, res) => this.delete(req, res, req.params.id))            
    }
}

module.exports = Controller