const express = require('express')
const assert = require('assert')
const { ObjectId } = require('mongoose').Types

const EventPhdCourse = require('../../models/EventPhdCourse')
const { log } = require('../middleware')
const { INDEX_PIPELINE, GET_PIPELINE, DAYS_BACK, pastDate } = require('./courses')

const router = express.Router()
module.exports = router

// inject functionality on the current route 
require('./personSearch')(router)

router.get('/', async (req, res) => {
    const person = req.person
    if (!person) return res.json({ data: [], person, DAYS_BACK, note: `user ${req.user?.username} has no associated person`})

    const data = await EventPhdCourse.aggregate([
        { $match: { 
            $or: [
                { coordinators: person._id },
                { lecturers: person._id }
            ],
            endDate: { $gte: pastDate() },
        }},
        ...INDEX_PIPELINE,
    ])

    res.json({ data, person, DAYS_BACK })
})

router.delete('/:id', async (req, res) => {
    assert(req.user._id) 

    const person = req.person
    if (!person) return res.status(404).json({ error: `user ${req.user?.username} has no associated person`})

    const course = await EventPhdCourse.findOneAndDelete({
        _id: new ObjectId(req.params.id),
        $or: [
            { coordinators: person._id },
            { lecturers: person._id }
        ],
        endDate: { $gte: pastDate() },
    })
    if (!course) return res.status(404).json({ error: "Course not found" })

    await log(req, course, {})

    res.json({})
})

router.get('/:id', async (req, res) => {
    assert(req.user._id)
    const person = req.person
    if (!person) return res.status(404).json({ error: `user ${req.user?.username} has no associated person`})

    if (req.params.id === '__new__') {
        // return empty object
        const course = new EventPhdCourse().toObject()
        course._id = undefined
        return res.json(course)
    }
    
    let _id
    try {
        _id = new ObjectId(req.params.id)
    } catch(error) {
        return res.status(400).json({ error: `Invalid id: ${req.params.id}` })
    }
    
    const data = await EventPhdCourse.aggregate([
        { $match: { 
            _id,
            $or: [
                { coordinators: person._id },
                { lecturers: person._id }
            ],
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
    const person = req.person
    if (!person) return res.status(404).json({ error: `user ${req.user?.username} has no associated person`})

    // override fields that user cannot change
    payload.createdBy = req.user._id
    payload.updatedBy = req.user._id
    delete payload._id

    if (!payload.endDate || new Date(payload.endDate) < pastDate()) {
        return res.status(422).json({ error: `endDate cannot be more than ${DAYS_BACK} days in the past` })
    }

    const course = new EventPhdCourse(payload)
    await course.save()

    await log(req, {}, payload)

    res.send({_id: course._id})
})

router.patch('/:id', async (req, res) => {
    console.log(`PATCH coursesMy ${req.params.id}`)
    const payload = {...req.body}

    assert(req.user._id)
    const person = req.person
    if (!person) return res.status(404).json({ error: `user ${req.user.username} has no associated person`})

    // remove fields that user cannot change
    delete payload._id
    delete payload.createdBy
    payload.updatedBy = req.user._id

    const course = await EventPhdCourse.findOneAndUpdate(
        {   _id: new ObjectId(req.params.id),
            $or: [
                { coordinators: person._id },
                { lecturers: person._id }
            ],
            endDate: { $gte: pastDate() }}, 
        payload)

    if (!course) return res.status(404).send({ error: "Not found" })
    
    await log(req, course, payload)

    res.send({})
})