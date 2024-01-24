const express = require('express')
const assert = require('assert')
const { ObjectId } = require('mongoose').Types

const Visit = require('../../models/Visit')
const Person = require('../../models/Person')
const RoomAssignment = require('../../models/RoomAssignment')
const EventSeminar = require('../../models/EventSeminar')
const { log } = require('../middleware')
const { INDEX_PIPELINE, GET_PIPELINE, DAYS_BACK, pastDate, notifyVisit} = require('./visits')

const router = express.Router()
module.exports = router

// inject functionality on the current route
require('./personSearch')(router)
require('./grantSearch')(router)

// inject room assignment functionality
// require('./roomAssignment')(router)

async function getPersonByEmail(email) {
    const persons = await Person.aggregate([
        { $match: {$or: [{email}, {alternativeEmails: email}]}},
    ])
    // console.log(`lookup person with email ${email}: ${JSON.stringify(persons)}`)
    if (persons.length === 0) return null
    if (persons.length > 1) {
        console.log(`WARNING: found ${persons.length} persons with email ${email}`)
    }
    return persons[0]
}

router.get('/', async (req, res) => {    
    if (!req.user) {
        res.status(401).json({
            result: "Unauthorized"
        })
        return
    }

    if (!req.user.email) return res.json({ data: [], note: `user ${req.user._id} has no email`})
    const person = await getPersonByEmail(req.user.email)
    if (!person) return res.json({ data: [], note: `no person found matching user ${req.user._id} email`})

    const data = await Visit.aggregate([
        { $match: { 
            referencePeople: person._id,
            endDate: { $gte: pastDate() },
        }},
        ...INDEX_PIPELINE,
    ])

    res.json({ data, person, DAYS_BACK })
})

router.delete('/:id', async (req, res) => {
    assert(req.user._id) 

    await notifyVisit(req.params.id, 'delete')

    if (!req.user.email) return res.status(404).json({ error: `user ${req.user._id} has no email`})
    const person = await getPersonByEmail(req.user.email)
    if (!person) return res.status(404).json({ error: `no person found matching user ${req.user._id} email`})

    const visit = await Visit.findOneAndDelete({
        _id: new ObjectId(req.params.id),
        referencePeople: person._id,
        endDate: { $gte: pastDate() },
    })
    if (!visit) return res.status(404)

    await log(req, visit, {})

    const roomAssignments = await RoomAssignment.aggregate([
        {$match: {
            person: visit.person,
            createdBy: req.user._id,
            $expr: {
                $and: [
                    { $or: [
                        { $eq: [visit.endDate, null] },
                        { $eq: ["$startDate", null] },
                        { $lte: ["$startDate", visit.endDate] } ]},
                    { $or: [
                        { $eq: [visit.startDate, null] },
                        { $eq: ["$endDate", null] },
                        { $gte: ["$endDate", visit.startDate] } ]}
                ]},
            },
        },
    ])
    for (const roomAssignment of roomAssignments) {
        await RoomAssignment.deleteOne({ _id: roomAssignment._id })
        await log(req, roomAssignment, {})
    }

    const seminarsPipeline = [
        { $match: { 
            createdBy: req.user._id,
            speaker: visit.person,
            $expr: {
                $and: [
                    { $or: [
                        { $eq: [visit.endDate, null] },
                        { $eq: ["$startDatetime", null] },
                        { $lte: ["$startDatetime", visit.endDate] } ]},
                    { $or: [
                        { $eq: [visit.startDate, null] },
                        { $eq: ["$startDatetime", null] },
                        { $gte: ["$startDatetime", visit.startDate] } ]}
            ]},
        }}
    ]

    const seminars = await EventSeminar.aggregate(seminarsPipeline)
    for (const seminar of seminars) {
        console.log(`deleting seminar ${seminar._id}`)
        await EventSeminar.deleteOne({ _id: seminar._id })
        await log(req, seminar, {})
    }

    res.json({})
})

router.get('/:id', async (req, res) => {
    assert(req.user._id)
    if (!req.user.email) return res.status(404).json({ error: `user ${req.user._id} has no email`})
    const person = await getPersonByEmail(req.user.email)
    if (!person) return res.status(404).json({ error: `no person found matching user ${req.user._id} email`})

    if (req.params.id === '__new__') {
        // return empty object
        const visit = new Visit().toObject()
        visit._id = undefined
        return res.json(visit)
    }
    let _id
    try {
        _id = new ObjectId(req.params.id)
    } catch(error) {
        return res.status(400).json({ error: `Invalid id: ${req.params.id}` })
    }
    const data = await Visit.aggregate([
        { $match: { 
            _id,
            referencePeople: person._id,
            endDate: { $gte: pastDate() },
        }},
        ...GET_PIPELINE,
    ])
    if (data.length === 0) {
        res.status(404).json({ error: "Not found" })
        return
    }
    res.json({...data[0], user_person: person})
})

router.put('/', async (req, res) => {
    const payload = {...req.body}

    assert(req.user._id)
    if (!req.user.email) return res.status(404).json({ error: `user ${req.user._id} has no email`})
    const person = await getPersonByEmail(req.user.email)
    if (!person) return res.status(404).json({ error: `no person found matching user ${req.user._id} email`})

    // override fields that user cannot change
    payload.createdBy = req.user._id
    payload.updatedBy = req.user._id
    payload.referencePeople = [person._id]
    delete payload._id

    if (!payload.endDate || new Date(payload.endDate) < pastDate()) {
        return res.status(422).json({ error: `endDate cannot be more than ${DAYS_BACK} days in the past` })
    }

    const visit = new Visit(payload)
    await visit.save()

    await log(req, {}, payload)
    notifyVisit(visit._id)

    res.send({_id: visit._id})
})

router.patch('/:id', async (req, res) => {
    const payload = {...req.body}

    assert(req.user._id)
    if (!req.user.email) return res.status(404).json({ error: `user ${req.user._id} has no email`})
    const person = await getPersonByEmail(req.user.email)
    if (!person) return res.status(404).json({ error: `no person found matching user ${req.user._id} email`})

    // remove fields that user cannot change
    delete payload._id
    delete payload.createdBy
    delete payload.referencePeople
    payload.updatedBy = req.user._id

    const visit = await Visit.findOneAndUpdate(
        {   _id: new ObjectId(req.params.id),
            createdBy: req.user._id,
            referencePeople: [person._id],
            endDate: { $gte: pastDate() }}, 
        payload)

    if (!visit) return res.status(404)
    
    await log(req, visit, payload)
    notifyVisit(visit._id)

    res.send({})
})
