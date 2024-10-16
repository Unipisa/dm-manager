const User = require('../models/User')
const Staff = require('../models/Staff')
const Person = require('../models/Person')
const RoomAssignment = require('../models/RoomAssignment')
const Group = require('../models/Group')
const Visit = require('../models/Visit')
const Grant = require('../models/Grant')
const Thesis = require('../models/Thesis')

const { log } = require('./middleware')
const { ObjectId } = require('../models/Model')

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
        
        const data = user.person
            ? await Person.aggregate([
                { $match: { _id: user.person } },
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
            : []

        res.send({
            data,
            editable_fields: Person._profile_editable_fields,
        })
    })

    router.get(`${path}/staff`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})
        
        const data = user.person ? await Staff.aggregate([
            // match person in people
            { $match: { person: user.person } },
            { $project: { notes: 0 }},
        ]) : []

        res.send({
            data,
            editable_fields: Staff._profile_editable_fields,
        })
    })

    router.get(`${path}/roomAssignment`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})

        const data = user.person ? await RoomAssignment.aggregate([
            // match person in people
            { $match: { person: user.person }},
            { $project: { notes: 0 }},
            { $lookup: {
                from: "rooms",
                localField: "room",
                foreignField: "_id",
                as: "room",
            }},
            { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
        ]) : []

        res.send({
            data,
            editable_fields: RoomAssignment._profile_editable_fields,
        })  
    })

    // get groups
    router.get(`${path}/group`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})

        const data = user.person ? await Group.aggregate([
            // match person in people or person in chair 
            { $match: { $or: [
                { members: user.person },
                { chair: user.person },
                { vice: user.person },
            ]}},
            { $project: { notes: 0 }},
        ]) : []

        res.send({
            data,
            editable_fields: Group._profile_editable_fields,
        })  
    })

    router.get(`${path}/visit`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})

        const data = user.person ? await Visit.aggregate([
            // match person in person or in referencePeople
            { $match: { $or: [
                { person: user.person },
                { referencePeople: user.person },
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
        ]) : []

        res.send({
            data,
            editable_fields: Visit._profile_editable_fields,
        })
    })

    router.get(`${path}/grant`, async (req, res) => {
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})

        const data = user.person ? await Grant.aggregate([
            // match people in pi, localCoordinator, members:
            { $match: { $or: [
                { pi: user.person },
                { localCoordinator: user.person },
                { members: user.person },
            ]}},
            { $project: { notes: 0 }},
        ]) : []

        res.send({
            data,
            editable_fields: Grant._profile_editable_fields,
        })
    })
    
    router.get(`${path}/thesis`, async (req, res) => {  
        const user = req.user || null
        if (!user) return res.status(401).send({error: "Not authenticated"})
        
        const data = user.person ? await Thesis.aggregate([
            // match people in person, advisors
            { $match: { $or: [
                { person: user.person },
                { advisors: user.person },
            ]}},
            { $project: { notes: 0 }},
            { $lookup: {
                from: "people",
                localField: "person",
                foreignField: "_id",
                as: "person",
                pipeline: [
                    { $project: { firstName: 1,
                                  lastName: 1, }},
                ],
            }},
            { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },
        ]) : []

        res.send({
            data,
            editable_fields: Thesis._profile_editable_fields,
        })
    })

    router.patch(`${path}/person/:id`, async (req, res) => {
        const user = req.user || null
        const id = req.params.id
        const modifiable_fields = Person._profile_editable_fields
        const payload = req.body

        if (!user.person.equals(id)) return res.status(401).send({error: "Not authorized"})

        try {
            const person = await Person.findById(id)
            req.log_who = user.username
            await log(req, person, payload)
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
