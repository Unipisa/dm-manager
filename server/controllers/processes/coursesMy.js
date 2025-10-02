const express = require('express')
const assert = require('assert')
const { ObjectId } = require('mongoose').Types
const EventPhdCourse = require('../../models/EventPhdCourse')
const Person = require('../../models/Person')
const { log } = require('../middleware')
const EventPhdCourseController = require('../EventPhdCourseController')
const controller = new EventPhdCourseController()
const { DAYS_BACK, pastDate } = require('./courses')

const router = express.Router()
module.exports = router

// inject functionality on the current route 
require('./personSearch')(router)
require('./conferenceRoomSearch')(router)
require('./mrbsRoomsBookings')(router)

router.get('/', async (req, res) => {
    const person = req.person
    if (!person) return res.json({ 
        data: [], 
        person,
        DAYS_BACK,
        note: `user ${req.user?.username} has no associated person`
    })
    
    const pipeline = [
        { $match: { 
            $or: [
                { coordinators: person._id },
                { lecturers: person._id },
                { createdBy: req.user._id },
            ],
            endDate: { $gte: pastDate() },
        }},
        ...controller.queryPipeline,
    ]
    
    const data = await EventPhdCourse.aggregate(pipeline)
    const processedData = await controller.aggregatePostProcess(data)
    
    res.json({ data: processedData, person, DAYS_BACK })
})

router.delete('/:id', async (req, res) => {
    assert(req.user._id) 
    const person = req.person
    if (!person) return res.status(404).json({ 
        error: `user ${req.user?.username} has no associated person`
    })
    
    try {
        const course = await EventPhdCourse.findOne({
            _id: new ObjectId(req.params.id),
            $or: [
                { coordinators: person._id },
                { lecturers: person._id },
                { createdBy: req.user._id },
            ],
            endDate: { $gte: pastDate() },
        })
        
        if (!course) return res.status(404).json({ error: "Course not found or not authorized" })
    } catch(error) {
        res.status(400).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    assert(req.user._id)
    const person = req.person
    if (!person) return res.status(404).json({ 
        error: `user ${req.user?.username} has no associated person`
    })
    
    if (req.params.id === '__new__') {
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
    
    const pipeline = [
        { $match: { 
            _id,
            $or: [
                { coordinators: person._id },
                { lecturers: person._id },
                { createdBy: req.user._id },
            ],
            endDate: { $gte: pastDate() },
        }},
        ...controller.queryPipeline,
    ]
    
    const data = await EventPhdCourse.aggregate(pipeline)
    const processedData = await controller.aggregatePostProcess(data)
    
    if (processedData.length === 0) {
        return res.status(404).json({ error: "Not found" })
    }
    
    res.json({...processedData[0], user_person: person})
})

router.post('/', async (req, res) => {
    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    }
    assert(req.user._id)
    const person = req.person
    if (!person) return res.status(404).json({ 
        error: `user ${req.user?.username} has no associated person`
    })
    
    delete payload._id
    
    if (!payload.endDate || new Date(payload.endDate) < pastDate()) {
        return res.status(422).json({ error: `endDate cannot be more than ${DAYS_BACK} days in the past` })
    }
    
    try {
        const course = EventPhdCourse(payload)
        await course.save()
        await log(req, {}, payload)
        res.send({_id: course._id})
    } catch (error) {
        res.status(400).send({ error: error.message })
    }
})

router.patch('/:id', async (req, res) => {
    console.log(`PATCH coursesMy ${req.params.id}`)
    const payload = {...req.body}
    assert(req.user._id)
    const person = req.person
    if (!person) return res.status(404).json({ 
        error: `user ${req.user?.username} has no associated person`
    })
    
    try {
        const course = await EventPhdCourse.findOne({
            _id: new ObjectId(req.params.id),
            $or: [
                { coordinators: person._id },
                { lecturers: person._id },
                { createdBy: req.user._id },
            ],
            endDate: { $gte: pastDate() }
        })
        
        if (!course) return res.status(404).json({ error: "Not found" })
        
        // Don't allow changing createdBy
        delete payload._id
        delete payload.createdBy
        payload.updatedBy = req.user._id
        
        const was = {...course.toObject()}
        course.set({ ...course.toObject(), ...payload })
        await course.save()
        
        await log(req, was, payload)
        res.send({})
    } catch (error) {
        res.status(400).send({ error: error.message })
    }
})

router.put('/save', async (req, res) => {    
    let payload = {
        ...req.body,
        updatedBy: req.user._id,
    }
    assert(req.user._id)
    const person = req.person
    if (!person) return res.status(404).json({ 
        error: `user ${req.user?.username} has no associated person`
    })
    
    try {
        if (!payload._id) {
            // Creating new course
            payload.createdBy = req.user._id
            delete payload._id
            
            if (!payload.endDate || new Date(payload.endDate) < pastDate()) {
                return res.status(422).json({ error: `endDate cannot be more than ${DAYS_BACK} days in the past` })
            }
            
            const course = EventPhdCourse(payload)
            await course.save()
            await log(req, {}, payload)
            res.send({_id: course._id})
        } else {
            // Updating existing course
            const course = await EventPhdCourse.findOne({
                _id: payload._id,
                $or: [
                    { coordinators: person._id },
                    { lecturers: person._id },
                    { createdBy: req.user._id },
                ],
                endDate: { $gte: pastDate() }
            })
            
            if (!course) return res.status(404).json({ error: "Not found" })
            
            delete payload.createdBy
            
            const was = {...course.toObject()}
            course.set({ ...course.toObject(), ...payload })
            await course.save()
            await log(req, was, payload)
            res.send({})
        }
    } catch (error) {
        res.status(400).send({ error: error.message })
    }
})

module.exports = router