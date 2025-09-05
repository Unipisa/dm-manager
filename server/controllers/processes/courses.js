const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const EventPhdCourse = require('../../models/EventPhdCourse')

const EventPhdCourseController = require('../EventPhdCourseController')
const controller = new EventPhdCourseController()
const {log} = require('../middleware')

/* inject functionality for widgets */
require('./personSearch')(router)
require('./conferenceRoomSearch')(router)

router.get('/', async (req, res) => {
    const pipeline = [
        ...controller.queryPipeline,
    ]
    const data = await EventPhdCourse.aggregate(pipeline)

    return res.send({
        data
    })
})

router.delete('/:id', async (req, res) => {
    try {
        const course = await EventPhdCourse.findById(new ObjectId(req.params.id))

        const user_is_creator = req.user.equals(course.createdBy)

        if (user_is_creator) {
            await course.delete()
            await log(req, course, {})
            res.json({})
        } else {
            res.status(401).json({
                error: "Cannot delete courses created by other users"
            })
        }
    } catch(error) {
        res.status(400).json({
            error: error.message
        })
    }
})

router.get('/get/:id', async (req, res) => {
    const pipeline = [
        {$match: {
            _id: new ObjectId(req.params.id),
        }},
        ...controller.queryPipeline,
    ]

    const data = await EventPhdCourse.aggregate(pipeline)

    return res.send({
        data,
    })
})

router.post('/', async (req, res) => {
    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    }

    try {
        const course = EventPhdCourse(payload)
        await course.save()
    } catch (error) {
        res.status(400).send({ error: error.message })
        return
    }
    await log(req, {}, payload)
    res.send({})
})

router.patch('/:id', async (req, res) => {
    const id = req.params.id
    let _id
    try {
        _id = new ObjectId(id)
    } catch (error) {
        res.status(400).send({ error: 'invalid id' })
        return
    }

    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    }

    try {
        const course = await EventPhdCourse.findById(_id)

        const user_is_creator = req.user.equals(course.createdBy)
        if (!user_is_creator) {
            res.status(403).json({ error: "Forbidden" })
            return
        }
        
        const was = {...course}
        course.set({ ...course, ...payload })
        await course.save()
        await log(req, was, payload)
        res.send({})
    }
    catch (error) {
        res.status(400).send({ error: error.message })
    }
})

router.put('/save', async (req, res) => {    
    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    }
    try {
        if (! payload._id) {
            const course = EventPhdCourse(payload)
            await course.save()
            await log(req, {}, payload)
        }
        else {
            const course = await EventPhdCourse.findById(payload._id)
            const user_is_creator = req.user.equals(course.createdBy)
            if (!user_is_creator) {
                res.status(403).json({ error: "Forbidden" })
                return
            }
            delete payload.createdBy
            
            const was = {...course}
            course.set({ ...course, ...payload })
            await course.save()
            await log(req, was, payload)
        }
        res.send({})
    }
    catch (error) {
        res.status(400).send({ error: error.message })
    }
})

module.exports = router