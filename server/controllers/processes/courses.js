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

const INDEX_PIPELINE = [
    { $lookup: {
        from: 'people',
        localField: 'coordinators',
        foreignField: '_id',
        as: 'coordinators',
        pipeline: [
            { $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }},
        ]
    }},
    { $lookup: {
        from: 'people',
        localField: 'lecturers',
        foreignField: '_id',
        as: 'lecturers',
        pipeline: [
            { $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }},
        ]
    }},
    // Basic lookup for conference rooms in lessons
    { $addFields: {
        lessons: {
            $map: {
                input: "$lessons",
                as: "lesson",
                in: {
                    $mergeObjects: [
                        "$$lesson",
                        { conferenceRoomId: "$$lesson.conferenceRoom" }
                    ]
                }
            }
        }
    }},
]
module.exports.INDEX_PIPELINE = INDEX_PIPELINE

const GET_PIPELINE = [
    { $lookup: {
        from: 'people',
        localField: 'coordinators',
        foreignField: '_id',
        as: 'coordinators',
        pipeline: [
            { $lookup: {
                from: 'institutions',
                localField: 'affiliations',
                foreignField: '_id',
                as: 'affiliations',
                pipeline: [
                    { $project: {
                        _id: 1,
                        name: 1,
                    }},
                ]
            }},
            { $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                affiliations: 1,
                email: 1,
            }},
        ]
    }},
    { $lookup: {
        from: 'people',
        localField: 'lecturers',
        foreignField: '_id',
        as: 'lecturers',
        pipeline: [
            { $lookup: {
                from: 'institutions',
                localField: 'affiliations',
                foreignField: '_id',
                as: 'affiliations',
                pipeline: [
                    { $project: {
                        _id: 1,
                        name: 1,
                    }},
                ]
            }},
            { $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                affiliations: 1,
                email: 1,
            }},
        ]
    }},
    // Expand createdBy
    {$lookup:{
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
            {$project: {
                _id: 1,
                username: 1,
            }},
        ],
    }},
    {$unwind: {
        path: "$createdBy",
        preserveNullAndEmptyArrays: true
    }},
    // Enhanced lessons with conference room details
    { $addFields: {
        lessons: {
            $map: {
                input: "$lessons",
                as: "lesson",
                in: {
                    date: "$$lesson.date",
                    duration: "$$lesson.duration",
                    mrbsBookingID: "$$lesson.mrbsBookingID",
                    conferenceRoomId: "$$lesson.conferenceRoom"
                }
            }
        }
    }},
    // Lookup conference rooms for lessons (this is complex due to embedded structure)
    { $lookup: {
        from: 'conferencerooms',
        localField: 'lessons.conferenceRoomId',
        foreignField: '_id',
        as: 'conferenceRoomsData'
    }},
    // Merge conference room data back into lessons
    { $addFields: {
        lessons: {
            $map: {
                input: "$lessons",
                as: "lesson",
                in: {
                    $mergeObjects: [
                        "$$lesson",
                        {
                            conferenceRoom: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$conferenceRoomsData",
                                            cond: { $eq: ["$$this._id", "$$lesson.conferenceRoomId"] }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    ]
                }
            }
        }
    }},
    // Clean up temporary fields
    { $unset: ["conferenceRoomsData", "lessons.conferenceRoomId"] }
]
module.exports.GET_PIPELINE = GET_PIPELINE

router.get('/', async (req, res) => {
    let authorization_alternatives = [
        { createdBy: req.user._id },
    ]
    if (req?.person?._id) authorization_alternatives.push({ coordinators: new ObjectId(req.person._id) })

    const pipeline = [
        {$match: {
            $or: authorization_alternatives
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
        let user_is_coordinator = false
        if (course.coordinators && course.coordinators.length > 0) {
            const coordinators = await Person.find({ _id: { $in: course.coordinators }})
            user_is_coordinator = req.person && coordinators.some(o => o._id.equals(req.person._id))
        }

        const user_is_creator = req.user.equals(course.createdBy)

        if (user_is_creator || user_is_coordinator) {
            await course.delete()
            await log(req, course, {})
            res.json({})
        } else {
            res.status(401).json({
                error: "Cannot delete courses created by other users or not in the coordinators list"
            })
        }
    } catch(error) {
        res.status(400).json({
            error: error.message
        })
    }
})

router.get('/get/:id', async (req, res) => {
    let authorization_alternatives = [
        { createdBy: req.user._id },
    ]
    if (req?.person?._id) authorization_alternatives.push({ coordinators: new ObjectId(req.person._id) })

    const pipeline = [
        {$match: {
            _id: new ObjectId(req.params.id),
            $or: authorization_alternatives
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
        if (course.coordinators && course.coordinators.length > 0) {
            const coordinators = await Person.find({ _id: { $in: course.coordinators } })

            const user_is_creator = req.user.equals(course.createdBy)
            const user_is_coordinator = req.person && coordinators.find(o => o._id.equals(req.person._id))
    
            if (!user_is_creator && !user_is_coordinator) {
                res.status(403).json({ error: "Forbidden" })
                return
            }
        } else {
            const user_is_creator = req.user.equals(course.createdBy)
            if (!user_is_creator) {
                res.status(403).json({ error: "Forbidden" })
                return
            }
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
            if (course.coordinators && course.coordinators.length > 0) {
                            const coordinators = await Person.find({ _id: { $in: course.coordinators } })
                            
                            const user_is_creator = req.user.equals(course.createdBy)
                            const user_is_coordinator = req.person && coordinators.find(o => o._id.equals(req.person._id))
                    
                            if (!user_is_creator && !user_is_coordinator) {
                                res.status(403).json({ error: "Forbidden" })
                                return
                            }
                        } else {
                            const user_is_creator = req.user.equals(course.createdBy)
                            if (!user_is_creator) {
                                res.status(403).json({ error: "Forbidden" })
                                return
                            }
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