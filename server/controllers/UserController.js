const User = require('../models/User')
const Controller = require('./Controller')

class UserController extends Controller {
    constructor() {
        super(User)
        this.path = 'user'
        this.fields.lastName.match_regex = true
        this.searchFields = [ 'username', 'email', 'firstName', 'lastName', 'roles' ]
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