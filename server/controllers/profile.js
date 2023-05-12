const User = require('../models/User')
const Staff = require('../models/Staff')
const Person = require('../models/Person')
const RoomAssignment = require('../models/RoomAssignment')
const Group = require('../models/Group')
const Visit = require('../models/Visit')
const Grant = require('../models/Grant')

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

    router.get(`${path}/roomAssignment`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})

        const people = await Person.find({ email: user.email })

        const data = await RoomAssignment.aggregate([
            // match person in people
            { $match: { person: { $in: people.map(p => p._id) } } },
            { $project: { notes: 0 }},
            { $lookup: {
                from: "rooms",
                localField: "room",
                foreignField: "_id",
                as: "room",
            }},
            { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
        ])

        res.send({
            data,
            editable_fields: RoomAssignment._profile_editable_fields,
        })  
    })

    // get groups
    router.get(`${path}/group`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})

        const people = await Person.find({ email: user.email })
        const people_ids = people.map(p => p._id)

        const data = await Group.aggregate([
            // match person in people or person in chair 
            { $match: { $or: [
                { members: { $in: people_ids } },
                { chair: { $in: people_ids } },
                { vice: { $in: people_ids } },
            ]}},
            { $project: { notes: 0 }},
        ])

        res.send({
            data,
            editable_fields: Group._profile_editable_fields,
        })  
    })

    router.get(`${path}/visit`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})

        const people = await Person.find({ email: user.email })
        const people_ids = people.map(p => p._id)

        const data = await Visit.aggregate([
            // match person in person or in referencePeople
            { $match: { $or: [
                { person: { $in: people_ids } },
                { referencePeople: { $in: people_ids } },
            ]}},
            // lookup person
            { $lookup: {
                from: "people",
                localField: "person",
                foreignField: "_id",
                as: "person",
            }},
            { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },
            { $project: { notes: 0 }},
        ])

        res.send({
            data,
            editable_fields: Visit._profile_editable_fields,
        })
    })

    router.get(`${path}/grant`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})

        const people = await Person.find({ email: user.email })
        const people_ids = people.map(p => p._id)

        const data = await Grant.aggregate([
            // match people in pi, localCoordinator, members:
            { $match: { $or: [
                { pi: { $in: people_ids } },
                { localCoordinator: { $in: people_ids } },
                { members: { $in: people_ids } },
            ]}},
            { $project: { notes: 0 }},
        ])

        res.send({
            data,
            editable_fields: Grant._profile_editable_fields,
        })
    })
    
    router.patch(`${path}/person/:id`, async (req, res) => {
        const user = req.user || null
        const id = req.params.id
        const modifiable_fields = Person._profile_editable_fields
        const payload = req.body
        try {
            const person = await Person.findById(id)
            if (person.email != user.email) {
                // not authorized
                res.status(401).send({error: "Not authorized"})
                return
            }
            req.log_who = user.username
            log(req, person, payload)
            for(field of modifiable_fields) {
                if (payload[field] !== undefined) {
                    person[field] = payload[field]
                }
            }
            await person.save()
            res.send({})
        } catch(error) {
            console.error(error)
            res.status(400).send({error: error.message})
        }
    })
}
