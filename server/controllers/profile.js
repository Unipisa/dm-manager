const User = require('../models/User')
const Staff = require('../models/Staff')
const Person = require('../models/Person')

module.exports = function profile(router, path) {
    router.get(path, async (req, res) => {
        const user = req.user || null
        const pipeline = [
            { $match: { email: user.email } },
            { $project: { notes: 0 }},
            { $lookup: {
                from: "staffs",
                localField: "_id",  
                foreignField: "person",
                as: "staffs",
                pipeline: [
                    { $project: { notes: 0 }},
                ],
            }}
        ]
        const people = (user.email ? await Person.aggregate(pipeline) : [])

        if (user) {
           res.send({
                user,
                people,
                editable_fields: {
                    user: User._profile_editable_fields,
                    person: Person._profile_editable_fields,
                    staff: Staff._profile_editable_fields,
                }
            })
        } else {
            res.status(401).send({error: "Not authenticated"})
        }
    })

    router.patch(`${path}/person/:id`, async (req, res) => {
        const user = req.user || null
        const id = req.params.id
        const modifiable_fields = []
        try {
            const person = await Person.findById(id)
            if (person.email != user.email) {
                // not authorized
                res.status(401).send({error: "Not authorized"})
                return
            }
            log(req, person, payload)

            person.set({...was, ...payload})
            await was.save()
            res.send(was)
        } catch(error) {
            console.log(`error: ${error.message}}`)
            console.error(error)
            res.status(400).send({error: error.message})
        }
        await Person.aggregate([])
        console.log(req.body)
        res.status(501).send({error: "Not implemented"})
    })
}
