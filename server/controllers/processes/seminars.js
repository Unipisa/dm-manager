const express = require('express')
const router = express.Router()

const EventSeminar = require('../../models/EventSeminar')

const SeminarCategoryController = require('../SeminarCategoryController')
const ConferenceRoomController = require('../ConferenceRoomController')
const PersonController = require('../PersonController')
const InstitutionController = require('../InstitutionController')
const EventSeminarController = require('../EventSeminarController')
const GrantController = require('../GrantController')

const controller = new EventSeminarController()

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
    const seminar = await EventSeminar.findById(req.params.id)

    if (req.user.equals(seminar.createdBy)) {
        await seminar.delete()
        res.json({})
    }
    else {
        res.status(401).json({
            error: "Cannot delete seminars created by other users"
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
            if (seminar.createdBy.equals(req.user)) {
                res.status(401).json({ error: "Forbidden" })
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

router.get('/add/person/search', async (req, res) => {
    const controller = new PersonController()
    await controller.search(req, res)
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

router.get('/add/grant/search', async (req, res) => {
    const controller = new GrantController()
    await controller.search(req, res)
})


module.exports = router