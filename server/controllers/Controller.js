const {log, requireSomeRole} = require('./middleware') 

function sendBadRequest(res, message) {
    res.status(400)
    res.send({error: message})
}

class Controller {
    constructor() {
        // every controller must define a unique path
        this.path = null

        // roles which have write access
        this.managerRoles = ['admin']

        // roles which have read access
        this.supervisorRoles = ['admin', 'supervisor']

        // the mongoose Model of the managed objects
        this.Model = null

        // these fields contain foreignkey ids which 
        // are going to be expanded with the referred objects
        this.populate_fields = ['createdBy', 'updatedBy']

        // information of fields which can be used
        // as filter and as sort keys. 
        // maps: field_name => options
        // options includes:
        //  can_sort: true/false
        //  can_filter: true/false
        //  match_regex: use this regexp to match values
        //  match_integer: integer expected
        //  match_ids: comma separated list of mongo ids
        this.fields = {}
    }

    async get(req, res, id) {
        try {
            let obj = await this.Model
                .findById(id)
                .populate(this.populate_fields)
            res.send(obj)
        } catch(error) {
            console.error(error)
            res.status(404).send({error: error.message})
        }
    }

    async index (req, res) {
        let $match = {}
        let filter = {}
        let sort = "_id"
        let direction = 1
        let limit = 100

        const fields = this.fields

        for (let key in req.query) {
            let value = req.query[key];
            if (key == '_direction') {
                if (value=="1") direction = 1
                else if (value=="-1") direction = -1
                else return sendBadRequest(res, `invalid _direction ${value}: 1 or -1 expected`)
            } else if (key == '_limit') {
                limit = parseInt(value);
                if (isNaN(limit) || limit < 0) return sendBadRequest(res, `invalid _limit ${value}: positive integer expected`)
            } else if (key == '_sort') {
                if (value.length) {
                    if (value[0] === '+') {
                        direction = 1
                        value = value.slice(1)
                    } else if (value[0] === '-') {
                        direction = -1
                        value = value.slice(1)
                    }
                }
                if (!(fields[value] && fields[value].can_sort)) {
                    return sendBadRequest(res, `invalid _sort key ${value}. Fields: ${ JSON.stringify(fields) }`)
                }
                sort = value;
            } else if (fields[key] && fields[key].can_filter) {
                const field = fields[key];
                filter[key] = value;
                if (field.match_regex) {
                    $match[key] = { $regex: field.match_regex(value) }
                } else if (field.match_integer) {
                    try {
                        $match[key] = parseInt(value);
                    } catch (err) {
                        return sendBadRequest(res, `integer expected but got string: "${value}"`)
                    }
                } else if (field.match_ids) {
                    try {
                        $match['_id'] = {
                            $in: value.split(",").map(id => new mongoose.Types.ObjectId(id))
                        }
                    } catch(err) {
                        return sendBadRequest(res, `comma separated list of mongo ids expected but got "${value}"`)
                    }
                } else {
                    $match[key] = value;
                }
            }
        }

        console.log(`match ${$match} requested in index`)

        let total, data;
        const $sort = {};
        $sort[sort] = direction;

        if (direction < 0) sort = `-${sort}`

        const result = await this.Model.aggregate(
            [
                {$match},
                {$sort},
                {$facet:{
                    "counting" : [ { "$group": {_id:null, count:{$sum:1}}} ],
                    "limiting" : [ { "$skip": 0}, {"$limit": limit} ]
                }},
                {$unwind: "$counting"},
                {$project:{
                    total: "$counting.count",
                    data: "$limiting"
                }}
            ]);

        if (result.length === 0) {
            total = 0;
            data = result;
        } else {
            [{ total, data }] = result;
        }
            
        console.log(`${data.length} / ${total} items collected`);

        return res.send({
            data,
            limit,
            sort,
            filter,
            total
        })
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

    register_path(router, method, path, roles, callback) {
        router[method](path, requireSomeRole(...roles), callback)

        // brief JSON description of path
        return {
            method: method.toUpperCase(),
            path,
            roles,
            approximative_object_keys: Object.keys(this.Model.schema.obj)
        }
    }

    register(router) {
        return [
            this.register_path(router, 'get', `/${this.path}/:id`, 
                this.managerRoles, 
                (req, res) => this.get(req, res, req.params.id)),

            this.register_path(router, 'get', `/${this.path}`, 
                this.supervisorRoles, 
                (req, res) => this.index(req, res)),

            this.register_path(router, 'put', `/${this.path}`, 
                this.managerRoles, 
                (req, res) => this.put(req, res)),

            this.register_path(router, 'patch', `/${this.path}/:id`, 
                this.managerRoles, 
                (req, res) => {
                    console.log("BUH")
                    const payload = {...req.body,
                        updatedBy: req.user._id
                    }
                    delete payload.createdBy
                    delete payload.createdAt
                    delete payload.updatedAt
                    this.patch(req, res, req.params.id, payload)
                }),

            this.register_path(router, 'delete', `/${this.path}/:id`, 
                this.managerRoles, 
                (req, res) => this.delete(req, res, req.params.id)),

        ]
    }
}

module.exports = Controller