const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const EventSeminar = require('../../models/EventSeminar')

const InstitutionController = require('../InstitutionController')
const EventSeminarController = require('../EventSeminarController')
const GrantController = require('../GrantController')
const Person = require('../../models/Person')
const controller = new EventSeminarController()
const {log} = require('../middleware')

/* inject functionality for widgets */
require('./personSearch')(router)
require('./conferenceRoomSearch')(router)
require('./seminarCategorySearch')(router)

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

router.post('/', async (req, res) => {
    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    }

    try {
        const seminar = EventSeminar(payload)
        await seminar.save()
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
        const seminar = await EventSeminar.findById(_id)
        if (!seminar.createdBy.equals(req.user._id)) {
            res.status(403).json({ error: "Forbidden" })
            return
        }
        
        const was = {...seminar}
        seminar.set({ ...seminar, ...payload })
        await seminar.save()
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

router.get('/institution/search', async (req, res) => {
    const controller = new InstitutionController()
    await controller.search(req, res)
})

router.put('/institution', async (req, res) => {
    const controller = new InstitutionController()
    await controller.put(req, res)
})

router.get('/grant/search', async (req, res) => {
    const controller = new GrantController()
    await controller.search(req, res)
})


module.exports = router