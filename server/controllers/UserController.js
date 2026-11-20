const User = require('../models/User')
const Controller = require('./Controller')

const writableFields = ['firstName', 'lastName', 'email', 'username', 'roles', 'person']

function validateUserPayload(req, res) {
    const body = req.body
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        res.status(400).send({ error: 'Expected a user object' })
        return false
    }
    if (Object.hasOwn(body, 'hash') || Object.hasOwn(body, 'salt')) {
        res.status(400).send({ error: 'Use the password endpoint to change credentials' })
        return false
    }
    req.body = Object.fromEntries(writableFields
        .filter(field => Object.hasOwn(body, field))
        .map(field => [field, body[field]]))
    return true
}

class UserController extends Controller {
    constructor() {
        super(User)
        this.path = 'user'
        this.createRoles = this.managerRoles
        this.fields.lastName.match_regex = true
        this.searchFields = [ 'username', 'email', 'firstName', 'lastName', 'roles' ]

        // Aggregations ignore the "select: false" of the password fields
        // added by passport-local-mongoose: never return them. Every read
        // endpoint (index, search, get) runs this pipeline.
        this.queryPipeline.push({ $project: { hash: 0, salt: 0 } })
        if (this.indexPipeline.length) this.indexPipeline.push({ $project: { hash: 0, salt: 0 } })
    }

    async put(req, res) {
        if (!validateUserPayload(req, res)) return
        return super.put(req, res)
    }

    async patch(req, res, id) {
        if (!validateUserPayload(req, res)) return
        return super.patch(req, res, id)
    }

    register(router) {
        const paths = super.register(router)

        // Add endpoint to check if a user has a local password
        paths.push(this.register_path(router, 'get', `/${this.path}/:id/hasLocalPassword`,
            this.supervisorRoles,
            async (req, res) => {
                try {
                    const dbUser = await User.findById(req.params.id).select('hash')
                    const hasLocalPassword = !!(dbUser && dbUser.hash)
                    res.send({ hasLocalPassword })
                } catch(error) {
                    console.error(error)
                    res.status(400).send({error: error.message})
                }
            }
        ))

        // Add endpoint to set o cambiare la password locale
        paths.push(this.register_path(router, 'post', `/${this.path}/:id/setLocalPassword`,
            this.managerRoles,
            async (req, res) => {
                try {
                    const { newPassword } = req.body
                    if (!newPassword || newPassword.length < 8) {
                        return res.status(400).send({error: "La password deve essere di almeno 8 caratteri"})
                    }
                    const dbUser = await User.findById(req.params.id)
                    await dbUser.setPassword(newPassword)
                    await dbUser.save()
                    res.send({ success: true, message: dbUser.hash ? "Password locale aggiornata con successo" : "Password locale impostata con successo" })
                } catch(error) {
                    console.error(error)
                    res.status(400).send({error: error.message})
                }
            }
        ))

        return paths
    }
}

module.exports = UserController
