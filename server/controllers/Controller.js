const {log, requireSomeRole, requireUser} = require('./middleware') 

function sendBadRequest(res, message) {
    res.status(400)
    res.send({error: message})
}

class Controller {
    constructor(Model=null) {
        // every controller must define a unique path
        this.path = null

        // roles which have write access
        this.managerRoles = ['admin']

        // roles which have read access
        this.supervisorRoles = ['admin', 'supervisor']

        // roles which can make a simple search on this model
        this.searchRoles = ['admin', 'supervisor']

        // the mongoose Model of the managed objects
        this.Model = Model

        // these fields contain foreignkey ids which 
        // are going to be expanded with the referred objects
        this.populate_fields = ['createdBy', 'updatedBy']

        // Fields used in the search endpoint
        this.searchFields = []

        /***
         * information of fields which can be used
         * as filter and as sort keys. 
         * maps: field_name => options
         * options includes:
         *  can_sort: true/false
         *  can_filter: true/false
         *  match_regex: use this regexp to match values
         *  match_integer: integer expected
         *  match_ids: comma separated list of mongo ids
         *  match_date: true/false, enable special date comparisons
         ***/
        this.fields = {}
        if (this.Model) this.add_fields_from_model()
    }

    add_fields_from_model() {
        /***
         * Try to construct the fields information structure
         * needed by controller to build the queries
         * by inspecting the Model.
         * The derived class will have the ability 
         * to ignore or override these settings
         ***/
        function field_from_model_info(info) {
            if (typeof info !== 'object') {
                info = {
                    type: info,
                }
            }
            switch(info.type) {
                case String: return {
                        can_sort: true,
                        can_filter: true
                    }
                case Date: return {
                        can_sort: true,
                        can_filter: true,
                        match_date: true,
                    }
            }
        }

        Object.entries(this.Model.schema.obj)
            .forEach(([field, info]) => {
                if (field === 'updatedBy') return
                if (field === 'createdBy') return
                this.fields[field] = field_from_model_info(info)
            })

        if (this.Model.schema.options.timestamps) {
            this.fields['updatedAt'] = { can_sort: true }
            this.fields['createdAt'] = { can_sort: true }
            }
    
        }

    async getModel(req, res) {
        res.send(this.Model)
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

    async search(req, res) {
        const $search = req.query.q || ''
        const $escapedsearch = $search.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');

        var data = []
        for (var field of this.searchFields) {
            data = [ ...data, 
                ...await this.Model.find({ [field]: { $regex: new RegExp($escapedsearch, "i") }}).limit(10)
            ]
        }

        return res.send({ data })
    }

    async index (req, res) {
        console.log(`INDEX ${req.path} ${JSON.stringify(req.query)}`)

        let $match = {}
        let filter = {}
        let sort = "_id"
        let direction = 1
        let limit = 100

        const fields = this.fields

        for (let key in req.query) {
            let value = req.query[key];
            const key_parts = key.split('__')
            const key0 = key_parts[0]

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
            } else if (fields[key0] && fields[key0].can_filter) {
                const field = fields[key0];
                filter[key] = value;
                if (field.match_integer) {
                    try {
                        $match[key0] = parseInt(value);
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
                } else if (field.match_date) {
                    let date_value = null
                    if (value === 'today') {
                        date_value = new Date()
                    } else {
                        try {
                            date_value = new Date(value)
                        } catch(err) {
                            return sendBadRequest(res, `invalid date '${value}' for field '${key0}'`)
                        }
                    }
                    console.log(`date_value: ${date_value}`)
                    if (key_parts.length === 1) {
                        $match[key0] = date_value
                    } else if (key_parts.length === 2) {
                        const modifier = {
                            'lt': '$lt',
                            'gt': '$gt',
                            'gte': '$gte',
                            'lte': '$lte',
                        }[key_parts[1]]
                        if (!modifier) return sendBadRequest(res, `invalid field modifier '${key_parts[1]}'`)
                        if (!$match[key0]) $match[key0] = {}
                        $match[key0][modifier] = date_value
                    } else {
                        return sendBadRequest(res, `too many (${key_parts.length}) field modifiers in key '${key}'`)
                    }
                } else {
                    if (key_parts.length === 1) {
                        $match[key] = value
                    }
                    else {
                        if (key_parts[1] == 'regex') {
                            // We do case-insensitive regexp by default
                            $match[key0] = { $regex: new RegExp(value, "i") }
                        }
                        else {
                            return sendBadRequest(res, `Unsupported field modifier in '${key}'`)
                        }
                    }
                }
            }
        }

        console.log(`match ${JSON.stringify($match)} requested in index`)

        let total, data;
        const $sort = {};
        $sort[sort] = direction;

        if (direction < 0) sort = `-${sort}`

        let result = await this.Model.aggregate([
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
            ])
        
        
        if (result.length === 0) {
            total = 0;
            data = result;
        } else {
            [{ total, data }] = result;
            data = await this.Model.populate(data, this.populate_fields)
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
        router[method](path, 
            roles===null ? requireUser : requireSomeRole(...roles), 
            callback)
 
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
            this.register_path(router, 'get', `/${this.path}/Model`, 
                this.searchRoles, 
                (req, res) => this.getModel(req, res)),
    
            this.register_path(router, 'get', `/${this.path}/search/`,
                this.searchRoles,
                (req, res) => this.search(req, res)),

            this.register_path(router, 'get', `/${this.path}/:id`, 
                this.supervisorRoles, 
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
