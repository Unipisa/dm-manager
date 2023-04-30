const User = require('../models/User')
const Staff = require('../models/Staff')
const Person = require('../models/Person')
const { log } = require('./middleware')

module.exports = function profile(router, path) {
    
    router.get(`${path}/user`, async (req, res) => {
        const user = req.user || null
        res.send({
            data: [user],
            editable_fields: User._profile_editable_fields,
        })
    })

    router.get(`${path}/person`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})
        
        const data = (user.email 
            ? await Person.aggregate([
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
                }}]) 
            : [])

        res.send({
            data,
            editable_fields: Person._profile_editable_fields,
        })
    })

    router.get(`${path}/staff`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})
        
        const people = await Person.find({ email: user.email })

        const data = await Staff.aggregate([
            // match person in people
            { $match: { person: { $in: people.map(p => p._id) } } },
            { $project: { notes: 0 }},
        ])

        res.send({
            data,
            editable_fields: Staff._profile_editable_fields,
        })
    })

    router.patch(`${path}/person/:id`, async (req, res) => {
        const user = req.user || null
        const id = req.params.id
        const modifiable_fields = Person._profile_editable_fields
        const payload = req.body
        console.log(`req.body: ${JSON.stringify(req.body)}`)
        console.log(`payload: ${JSON.stringify(payload)}`)
        try {
            const person = await Person.findById(id)
            if (person.email != user.email) {
                // not authorized
                res.status(401).send({error: "Not authorized"})
                return
            }
            log(req, person, payload)
            for(field of modifiable_fields) {
                if (payload[field] !== undefined) {
                    person[field] = payload[field]
                }
            }
            await person.save()
            console.log(`person: ${JSON.stringify(person)}`)
            res.send({})
        } catch(error) {
            console.log(`error: ${error.message}}`)
            console.error(error)
            res.status(400).send({error: error.message})
        }
    })
}
