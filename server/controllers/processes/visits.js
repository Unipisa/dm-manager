const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const Visit = require('../../models/Visit')
const Person = require('../../models/Person')
const Grant = require('../../models/Grant')
const PersonController = require('../PersonController')
const GrantController = require('../GrantController')
const { escapeRegExp } = require('../Controller')

router.get('/', async (req, res) => {    
    if (!req.user) {
        res.status(401).json({
            result: "Unauthorized"
        })
        return
    }

    const data = await Visit.aggregate([
        { $match: { createdBy: req.user._id } },
        { $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'person',
            pipeline: [
                { $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                }},
            ]
        }},
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true,
        }},
        {$lookup: {
            from: 'affiliations',
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
])

    res.json({ data })
})

router.get('/add/person/search', async (req, res) => {
    const $regex = new RegExp(escapeRegExp(req.query.q), 'i')
    const data = await Person.aggregate([
        {$lookup: {
            from: 'institutions',
            localField: 'affiliations',
            foreignField: '_id',
            as: 'affiliations',
            pipeline: [
                {$project: {
                    _id: 1,
                    name: 1,
                }}
            ]
        }},
        {$project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            affiliations: 1,
        }},
        {$match: { $or: [
            { firstName: { $regex }},
            { lastName: { $regex }},
            { email: { $regex }},
        ]}},
    ])

    res.json({ data })
})

/*
router.delete('/:id', async (req, res) => {
    try {
        const seminar = await EventSeminar.findById(new ObjectId(req.params.id))

        if (req.user.equals(seminar.createdBy)) {
            await seminar.delete()
            res.json({})
        }
        else {
            res.status(401).json({
                error: "Cannot delete seminars created by other users"
            })
        }
    } catch(error) {
        res.status(400).json({
            error: error.message
        })
    }
})


router.get('/get/:id', async (req, res) => {
    const controller = new EventSeminarController()
    controller.performQuery({
        _id: req.params.id, 
        createdBy: req.user._id
    }, res)
})

router.put('/save', async (req, res) => {
    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    }

    try {
        if (! payload._id) {
            const seminar = EventSeminar(payload)
            await seminar.save()
        }
        else {
            const seminar = await EventSeminar.findById(payload._id)
            if (!seminar.createdBy.equals(req.user._id)) {
                res.status(403).json({ error: "Forbidden" })
                return
            }
            delete payload.createdBy
            
            seminar.set({ ...seminar, ...payload })
            await seminar.save()
        }
        res.send({})
    }
    catch (error) {
        res.status(400).send({ error: error.message })
    }
})

router.get('/add/person/by-email', async (req, res) => {
    const email = req.query.email
    if (email) {
        const p = await Person.aggregate([
            { $match: { email } }, 
            { $project: {
                _id: 1, 
                firstName: 1, 
                lastName: 1,
                email: 1
        }}])
        res.json({ data: p })
    }
    else {
        res.status(404).json({ error: "Missing email field"})
    }
})

router.put('/add/person', async (req, res) => {
    const controller = new PersonController()
    await controller.put(req, res)
})

router.get('/add/seminar-category/search', async (req, res) => {
    const controller = new SeminarCategoryController()
    await controller.search(req, res)
})

router.get('/add/conference-room/search', async (req, res) => {
    const controller = new ConferenceRoomController()
    await controller.search(req, res)
})

router.get('/add/institution/search', async (req, res) => {
    const controller = new InstitutionController()
    await controller.search(req, res)
})

router.put('/add/institution', async (req, res) => {
    const controller = new InstitutionController()
    await controller.put(req, res)
})
*/
router.get('/add/grant/search', async (req, res) => {
    const $regex = new RegExp(escapeRegExp(req.query.q), 'i')
    const data = await Grant.aggregate([
        { $lookup: {
            from: 'people',
            localField: 'pi',
            foreignField: '_id',
            as: 'pi',
            pipeline: [
                { $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                }},
            ]
        }},/*
        { $match: {
            startDate: { $lte: "$$NOW" },
            endDate: { $gte: "$$NOW" },
        }},*/
        { $match: { $or: [
            { title: { $regex }},
            { code: { $regex }},
            { 'pi.lastName': { $regex }},
        ]}},
        { $project: {
            _id: 1,
            name: 1,
            identifier: 1,
            pi: 1,
        }},
    ])
    res.json({ data })
})

module.exports = router