const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const EventSeminar = require('../../models/EventSeminar')

const SeminarCategoryController = require('../SeminarCategoryController')
const ConferenceRoomController = require('../ConferenceRoomController')
const PersonController = require('../PersonController')
const InstitutionController = require('../InstitutionController')
const EventSeminarController = require('../EventSeminarController')
const GrantController = require('../GrantController')
const Person = require('../../models/Person')
const controller = new EventSeminarController()
const {log} = require('../middleware')

/* inject functionality for person select widget */
require('./personSearch')(router)

router.get('/', async (req, res) => {    
    if (req.user === undefined) {
        res.status(401).json({
            result: "Unauthorized"
        })
    }
    else {
        controller.performQuery({ createdBy: req.user._id }, res)
    }

})

router.delete('/:id', async (req, res) => {
    try {
        const seminar = await EventSeminar.findById(new ObjectId(req.params.id))

        if (req.user.equals(seminar.createdBy)) {
            await seminar.delete()
            await log(req, seminar, {})
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
            await log(req, {}, payload)
        }
        else {
            const seminar = await EventSeminar.findById(payload._id)
            if (!seminar.createdBy.equals(req.user._id)) {
                res.status(403).json({ error: "Forbidden" })
                return
            }
            delete payload.createdBy
            
            const was = {...seminar}
            seminar.set({ ...seminar, ...payload })
            await seminar.save()
            await log(req, was, payload)
        }
        res.send({})
    }
    catch (error) {
        res.status(400).send({ error: error.message })
    }
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

router.get('/add/grant/search', async (req, res) => {
    const controller = new GrantController()
    await controller.search(req, res)
})


module.exports = router