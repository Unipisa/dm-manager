const express = require('express')
const router = express.Router()
module.exports = router
const { ObjectId } = require('mongoose').Types

const EventPhdCourse = require('../../models/EventPhdCourse')
const Person = require('../../models/Person')

const EventPhdCourseController = require('../EventPhdCourseController')
const controller = new EventPhdCourseController()
const {log} = require('../middleware')

/* inject functionality for widgets */
require('./personSearch')(router)
require('./conferenceRoomSearch')(router)
require('./mrbsRoomsBookings')(router)

const DAYS_BACK = 365
module.exports.DAYS_BACK = DAYS_BACK

function pastDate() {
    const d = new Date()
    d.setDate(d.getDate() - DAYS_BACK)
    return d
}
module.exports.pastDate = pastDate


router.get('/', async (req, res) => {
    const pipeline = [
        {$match: {
            endDate: { $gte: pastDate() },
        }},
        ...controller.queryPipeline,
    ]
    const data = await EventPhdCourse.aggregate(pipeline)
    const processedData = await controller.aggregatePostProcess(data)
    return res.send({
        data: processedData,
    })
})

router.delete('/:id', async (req, res) => {
    try {
        const course = await EventPhdCourse.findById(new ObjectId(req.params.id))
    
        await course.delete()
        await log(req, course, {})
        res.json({})
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
            endDate: { $gte: pastDate() },
        }},
        ...controller.queryPipeline,
    ]

    const data = await EventPhdCourse.aggregate(pipeline)
    const processedData = await controller.aggregatePostProcess(data)
    return res.send({
        data: processedData,
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