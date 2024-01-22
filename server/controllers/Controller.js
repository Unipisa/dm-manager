const { ObjectId } = require('mongoose').Types

const User = require('../models/User')
const {log, requireSomeRole, requireUser, allowAnonymous} = require('./middleware') 

function sendBadRequest(res, message) {
    res.status(400)
    res.send({error: message})
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * @class Controller
 * @classdesc Base class for all controllers
 * @param {Model} Model - the mongoose Model of the managed objects
 * 
 * extend this class to create a new controller
 * then register it in server/api.js
 * 
 */

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

        // the pipeline used in aggregate query of this.index
        this.queryPipeline = []

        // Fields used in the search endpoint
        this.searchFields = []
        this.abc = []

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

        if (this.Model) {
            this.fields = Model._schema_info.properties
            // inspect Model to add aggregation pipelines
            this.add_fields_aggregations_from_model()
        }
    }

    getSchema() {
        const schema = this.Model._schema_info
        const related = this.Model.relatedModels || []
        const fields = schema.properties
        return {
            fields,
            related: related.map(related => ({
                multiple: false,
                ...related,
            })),
            modelName: schema.title,
            path: this.path,
            managerRoles: this.managerRoles,
            supervisorRoles: this.supervisorRoles,
        }
    }

    add_fields_aggregations_from_model() {
        Object.entries(this.Model.schema.obj)
            .forEach(([field, info]) => {
                let single = true
                if (Array.isArray(info) && info.length === 1) {
                    single = false
                    info = info[0]
                }
                const unwind = field => this.queryPipeline.push(
                    {$unwind: {
                        "path": '$'+field,
                        "preserveNullAndEmptyArrays": true,
                    }})
                if (info.ref === 'Person') {
                    this.queryPipeline.push(
                        {$lookup: {
                            from: "people",
                            localField: field,
                            foreignField: "_id",
                            as: field,
                            pipeline: [{ $project: {
                                firstName: 1,
                                lastName: 1,
                                affiliations: 1,
                                email: 1,
                                phone: 1,
                                affiliation: 1,
                            }},
                            {$lookup: {
                                from: "institutions",
                                localField: "affiliations",
                                foreignField: "_id",
                                as: "affiliations",
                                pipeline: [{ $project: {
                                    name: 1,
                                }}]
                            }},
                            {$lookup: {
                                from: "staffs",
                                localField: "_id",  
                                foreignField: "person",
                                as: "staffs",
                                pipeline: [ 
                                    { $match: 
                                        { $expr: 
                                            { $and: [ 
                                                { $or: [ 
                                                    { $eq: [ "$endDate", null ] },
                                                    { $gte: [ "$endDate", "$$NOW" ] }
                                                ]}, 
                                                { $or: [
                                                    { $eq: [ "$startDate", null ] },
                                                    { $lte: [ "$startDate", "$$NOW" ] }
                                                ]
                                                }]}}
                                    }, 
                                    { $project: {
                                        qualification: 1,
                                        isInternal: 1
                                    }
                                }]
                            }},
                            ],
                        }},
                    )
                    if (single) unwind(field)
                } else if (info.ref === 'Grant') {
                    this.queryPipeline.push(
                        {$lookup: {
                            from: "grants",
                            localField: field,
                            foreignField: "_id",
                            as: field,
                            pipeline: [{ $project: {
                                identifier: 1,
                                name: 1,
                            }}],
                        }},
                    )
                    if (single) unwind(field)
                } else if (info.ref === 'Institution') {
                    this.queryPipeline.push(
                        {$lookup: {
                            from: "institutions",
                            localField: field,
                            foreignField: "_id",
                            as: field,
                            pipeline: [{ $project: {
                                name: 1,
                            }}]
                        }},
                    )
                    if (single) unwind(field)
                } else if (info.ref === 'User') {
                    this.queryPipeline.push(
                        {$lookup: {
                            from: "users",
                            localField: field,
                            foreignField: "_id",
                            as: field,
                            pipeline: [{ $project: {
                                firstName: 1,
                                lastName: 1,
                                username: 1,
                                email: 1,
                                photoUrl: 1,
                            }}]
                        }},
                    )
                    if (single) unwind(field)
                } else if (info.ref === 'Room') {
                    this.queryPipeline.push(
                        {$lookup: {
                            from: "rooms",
                            localField: field,
                            foreignField: "_id",
                            as: field,
                            pipeline: [{ $project: {
                                code: 1,
                                number: 1,
                                floor: 1,
                                building: 1,
                            }}]
                        }})
                    if (single) unwind(field)
                } else if (info.ref === 'ConferenceRoom') {
                    this.queryPipeline.push(
                        {$lookup: {
                            from: "conferencerooms",
                            localField: field,
                            foreignField: "_id",
                            as: field,
                            pipeline: [{ $project: {
                                name: 1,
                                room: 1,
                            }}]
                        }})
                    if (single) unwind(field)
                } else if (info.ref === 'SeminarCategory') {
                    this.queryPipeline.push(
                        {$lookup: {
                            from: "seminarcategories",
                            localField: field,
                            foreignField: "_id",
                            as: field,
                            pipeline: [{ $project: {
                                name: 1,
                                label: 1,
                            }}]
                        }})
                    if (single) unwind(field)
                }
            })
    }

    async getModel(req, res) {
        res.send(this.getSchema())
    }

    async aggregatePostProcess(results) {
        return results
    }

    async performQuery(query, res, { fields, searchFields, queryPipeline, path, Model } = {}) {
        let $matches = []
        let $match_lookups = {}
        let $sort = {_id: 1}
        let filter = {}
        let sort = null
        let direction = 1
        let limit = 0
        let search_conditions = []

        fields ||= this.fields
        searchFields ||= this.searchFields
        queryPipeline ||= this.queryPipeline
        path ||= this.path
        Model ||= this.Model

        if (query._direction) {
            if (query._direction=="1") direction = 1
            else if (query._direction=="-1") direction = -1
            else return sendBadRequest(res, `invalid _direction ${query._direction}: 1 or -1 expected`)
        }

        for (let key in query) {
            let value = query[key];
            const key_parts = key.split('__')
            const key0 = key_parts[0]

            if (key == '_direction') {
                // already processed
            } else if (key == '_limit') {
                limit = parseInt(value);
                if (isNaN(limit) || limit < 0) return sendBadRequest(res, `invalid _limit ${value}: positive integer expected`)
            } else if (key == '_sort') {
                sort = value
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
                const can_sort = fields[value].can_sort
                $sort={}
                if (can_sort === true) {
                    $sort[value] = direction
                } else {
                    // e' l'ordinamento di un campo strutturato
                    // mi aspetto un array di campi
                    can_sort.forEach(field => {
                        $sort[`${value}.${field}`] = direction
                    })
                }
            } else if (key == '_search') {
                try {
                    const $regex = new RegExp(escapeRegExp(value), 'i')
                    // Implement a custom filter over searchable fields
                    for (let field of searchFields) {
                        search_conditions.push({
                            [field]: { $regex }
                        })
                    }
                } catch (err) {
                    return sendBadRequest(res, `invalid _search value ${value} [${err}]`)
                }
            } else if (fields[key0] && fields[key0].can_filter) {
                const field = fields[key0];
                filter[key] = value;
                if (field.match_integer) {
                    try {
                        $matches.push({ [key0]: parseInt(value) })
                    } catch (err) {
                        return sendBadRequest(res, `integer expected but got string: "${value}"`)
                    }
                } else if (field.match_ids) {
                    try {
                        $matches.push({ [key0]: {
                            $in: value.split(",").map(id => new ObjectId(id))
                        } })
                    } catch(err) {
                        return sendBadRequest(res, `comma separated list of mongo ids expected but got "${value}"`)
                    }
                } else if (field.match_boolean) {
                    $matches.push({ [key0]: ['1','yes','true'].includes(value) })
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
                    if (key_parts.length === 1) {
                        $matches.push({ [key0]: date_value })
                    } else if (key_parts.length === 2) {
                        switch(key_parts[1]) {
                            case 'lt':
                                $matches.push({ [key0]: {$lt: date_value} })
                                break
                            case 'gt':
                                $matches.push({ [key0]: {$gt: date_value} })
                                break
                            case 'gte': 
                                $matches.push({ [key0]: {$gte: date_value} })
                                break
                            case 'lte':
                                $matches.push({ [key0]: {$lte: date_value} })
                                break
                            case 'gte_or_null':
                                $matches.push({ $or: [{[key0]: {$gte: date_value}}, { [key0]: null }]})
                                break
                            case 'gt_or_null':
                                $matches.push({ $or: [{[key0]: {$gt: date_value}}, { [key0]: null }]})
                                break
                            case 'lte_or_null':
                                $matches.push({ $or: [{[key0]: {$lte: date_value}}, { [key0]: null }]})
                                break
                            case 'lt_or_null':
                                $matches.push({ $or: [{[key0]: {$lt: date_value}}, { [key0]: null }]})
                                break
                            default:
                                return sendBadRequest(res, `invalid field modifier '${key_parts[1]}'`)
                        }
                    } else {
                        return sendBadRequest(res, `too many (${key_parts.length}) field modifiers in key '${key}'`)
                    }
                } else if (field.related_field) {
                    if (key_parts.length === 1) { 
                        try {
                            $matches.push({ [key0]: new ObjectId(value) })
                        } catch(err) {
                            console.error(err)
                            return sendBadRequest(res, `invalid id "${value}"`)
                        }
                    } else if (key_parts[1] === 'ne') {
                        try {
                            $matches.push({ [key0]: { $ne: new ObjectId(value) } })
                        } catch(err) {
                            console.error(err)
                            return sendBadRequest(res, `invalid id "${value}"`)
                        }
                    } else {
                        return sendBadRequest(res, `related field query not yet supported [${key0}__${key_parts[1]}]`)
                    }
                } else {
                    if (key_parts.length === 1) {
                        $matches.push({ [key0]: value })
                    } 
                    else {
                        if (key_parts[1] == 'regex') {
                            try {
                                const $regex = new RegExp(value, "i")
                                // We do case-insensitive regexp by default
                                $matches.push({ [key0]: { $regex } })
                            } catch(err) {
                                return sendBadRequest(res, `invalid regex "${value}"`)
                            }
                        } 
                        else if (key_parts[1] == 'in') {
                            $matches.push({ [key0]: { $in: value.split("|") } })
                        } 
                        else if (key_parts[1] == 'ne') {
                            $matches.push({ [key0]: { $ne: value } })
                        } else {
                            return sendBadRequest(res, `Unsupported field modifier in '${key}'`)
                        }
                    }
                }
            } else {
                return sendBadRequest(res, `Unknown filter field '${key}'`)
            }
        }

        let total, data;

        if (direction < 0) sort = `-${sort}`

        let $facet = {
            "counting" : [ { "$group": {_id:null, count:{$sum:1}}} ],
            "limiting": [ {$skip: 0} ]
        }
        if (limit>0) $facet.limiting.push({$limit: limit})

        const pipeline = [
            ...$matches.map(x => ({$match: x})),
            ...queryPipeline,
            {$match: $match_lookups},
            {$match: search_conditions.length > 0 ? {$or: search_conditions }: {}},
            {$sort},
            {$facet},
            {$unwind: "$counting"},
            {$project:{
                total: "$counting.count",
                data: "$limiting"
            }}
        ]
        
        //console.log(`${path} aggregate pipeline: ${JSON.stringify(pipeline/*, null, 2*/)}`)

        let result = await this.Model.aggregate(pipeline)
        
        if (result.length === 0) {
            total = 0;
            data = result;
        } else {
            // do postprocessing
            result[0].data = await this.aggregatePostProcess(result[0].data);
            
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

    async get(req, res, id) {
        if (id === '__new__') {
            const obj = (new this.Model()).toObject()
            obj._id = undefined
            return res.send(obj)
        }
        try {
            const pipeline = [
                {$match: {_id: ObjectId(id)}},
                ...this.queryPipeline
            ]
            console.log(`executing GET pipeline on ${this.path}: ${JSON.stringify(pipeline)}`)
            
            let obj = await this.Model.aggregate(pipeline)
            obj = await this.aggregatePostProcess(obj)

            if (obj.length === 0) {
                return res.status(404).send({error: `not found ${id}`})
            }
            if (obj.length > 1) {
                console.log(`INTERNAL ERROR: found more than one object ${this.path} with id ${id}`)
                return res.status(404).send({error: `not found ${id}`})
            }
            res.send(obj[0])
        } catch(error) {
            console.warn(error)

            console.log(`invalid _id: ${id}`)
            res.status(404).send({error: `invalid id ${id}`})
        }
    }

    async search(req, res) {
        console.log(`*** SEARCH ${req.path} ${JSON.stringify(req.query.q)}`)
        return this.performQuery({_search: req.query.q || ''}, res)
    }

    async index (req, res) {
        console.log(`*** INDEX ${req.path} ${JSON.stringify(req.query)}`)
        return this.performQuery(req.query, res)
    }

    async put(req, res) {
        console.log(`*** PUT ${req.path} ${JSON.stringify(req.body)}`)
        let payload = {
            ...req.body,
            createdBy: req.user._id,
            updatedBy: req.user._id,
        }
        delete payload.createdAt
        delete payload.updatedAt

        try {
            const obj = await this.Model.create(payload)
            await log(req, {}, obj)
            this.get(req, res, obj._id)
        } catch(err) {
            console.error(err)
            res.status(400).send({ error: err.message })
        }
    }

    async patch(req, res, id, payload) {    
        console.log(`*** PATCH ${id} ${JSON.stringify(payload)}`)
        try {
            const was = await this.Model.findById(id)
            
            const will = {...payload,
                updatedBy: req.user._id}
            delete will.createdAt
            delete will.createdBy
            delete will.updatedAt

            await log(req, was, will)
            was.set({...was, ...will})
            await was.save()
            res.send(was)
        } catch(error) {
            console.log(`error: ${error.message}}`)
            console.error(error)
            res.status(400).send({error: error.message})
        }
    }

    async delete(req, res, id) {
        console.log(`*** DELETE ${req.path} id=${id}`)
        try {
            const obj = await this.Model.findById(id)
            await log(req, obj.toObject(), {})
            obj.delete()
            res.send({})
        } catch(err) {
            console.error(err)
            res.status(400).send({ error: err.message })
        }
    }

    register_path(router, method, path, roles, callback) {
        const middleware = 
            roles === true ? requireUser 
            : roles === false ? allowAnonymous 
            : typeof(roles) === 'function' ? roles
            : requireSomeRole(...roles)
        router[method](path, middleware, callback)
 
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
                this.managerRoles.concat(this.searchRoles), 
                // searchRoles can create new objects, to enable
                // related object-managers to create references
                // to this object (as in ObjectInput)
                (req, res) => this.put(req, res)),

            this.register_path(router, 'patch', `/${this.path}/:id`, 
                this.managerRoles, 
                (req, res) => {
                    this.patch(req, res, req.params.id, payload)
                }),

            this.register_path(router, 'delete', `/${this.path}/:id`, 
                this.managerRoles, 
                (req, res) => this.delete(req, res, req.params.id)),

        ]
    }
}

Controller.escapeRegExp = escapeRegExp

module.exports = Controller
