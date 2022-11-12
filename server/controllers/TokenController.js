const Token = require('../models/Token')
const Controller = require('./Controller')
const { hasSomeRole, requireSomeRole, requireUser } = require('./middleware')

class TokenController extends Controller {
    constructor() {
        super(Token)
        this.path = 'token'
        this.Model = Token
        this.populate_fields = ['createdBy', 'updatedBy']
        this.fields = {} // disable queries on tokens
    }

    register(router) {
        // 1. tokens only have PUT, INDEX, DELETE (no GET, no PATCH)
        // 2. apart from the 'admin' role each user can only see and delete its own tokens
        // 3. apart from the 'admin' role each user can only create tokens with its own roles (or less)

        let paths = []

        paths.push({method: 'PUT', path: `/${this.path}`})
        router.put(`/${this.path}`, 
            requireUser, 
            (req, res) => {
                if (!req.body.roles) req.body.roles = []
                delete req.body.token

                // check that the user has the roles requested in the token
                req.body.roles.forEach(role => {
                    if (!hasSomeRole(req, 'admin', role)) {
                        res.status(403).send({ error: `cannot create Token with role "${role}" which you don't have`})
                        return
                    }
                })
                return this.put(req, res)
            })

        paths.push({ method: 'GET', path: `/${this.path}`})
        router.get(`/${this.path}`, requireUser, async (req, res) => {
            let filter = hasSomeRole(req, 'admin', 'supervisor') ? {} : { createdBy: req.user }
            let data = await this.Model.find(filter).populate({path: 'createdBy', select: 'username'})
            if (!hasSomeRole(req, 'admin')) {
                // togli il secret dai token di cui non sei proprietario
                data = data.map(token => {
                    if (token.createdBy !== req.user._id) {
                        token.token = '*HIDDEN*'
                    }
                    return token
                })
            }
            res.send({ data })
        })

        paths.push({ method: 'DELETE', path: `/${this.path}/:id`})
        router.delete(`/${this.path}/:id`, 
            requireUser, 
            async (req, res) => {
                let token = await this.Model.findById(req.params.id)
                if (token && (hasSomeRole(req, 'admin') || token.createdBy === req.user._id)) {
                    return this.delete(req,res,req.params.id)
                } else {
                    res.status(404)
                    res.send({ error: 'token not found'})
                }
            })

        return paths
    }
}

module.exports = TokenController