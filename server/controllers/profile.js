const Staff = require('../models/Staff')
const Person = require('../models/Person')

module.exports = function profile(router, path) {
    router.get(path, async (req, res) => {
        const user = req.user || null
        const people = user.email ? await Person.find({email: user.email}) : []
        if (user) {
            res.send({
                user,
                people,
            })
        } else {
            res.status(401).send({error: "Not authenticated"})
        }
    })
}
