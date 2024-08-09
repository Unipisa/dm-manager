const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const EventConference = require('../../models/EventConference')

const InstitutionController = require('../InstitutionController')
const EventConferenceController = require('../EventConferenceController')
const GrantController = require('../GrantController')
const controller = new EventConferenceController()
const {log} = require('../middleware')
const { notify } = require('../../models/Notification')

/* inject functionality for widgets */
require('./conferenceRoomSearch')(router)

async function notifyConference(conference) {
    const text = `
    È stato creato o modificato un convegno.
    
    Il titolo del convegno è ${conference.title}; la descrizione è disponibile al link https://www.dm.unipi.it/en/conference/?id=${conference._id}. 
    `;
    await notify('process/conferences', `${conference._id}`, text);
}

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
        const conference = await EventConference.findById(new ObjectId(req.params.id))

        if (req.user.equals(conference.createdBy)) {
            await conference.delete()
            await log(req, conference, {})
            res.json({})
        }
        else {
            res.status(401).json({
                error: "Cannot delete conferences created by other users"
            })
        }
    } catch(error) {
        res.status(400).json({
            error: error.message
        })
    }
})

router.get('/get/:id', async (req, res) => {
    const controller = new EventConferenceController()
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
        const conference = EventConference(payload)
        await conference.save()
        await notifyConference(conference)
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
        const conference = await EventConference.findById(_id)
        if (!conference.createdBy.equals(req.user._id)) {
            res.status(403).json({ error: "Forbidden" })
            return
        }
        
        const was = {...conference}
        conference.set({ ...conference, ...payload })
        await conference.save()
        await notifyConference(conference)
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
            const conference = EventConference(payload)
            await conference.save()
            await notifyConference(conference)
            await log(req, {}, payload)
        }
        else {
            const conference = await EventConference.findById(payload._id)
            if (!conference.createdBy.equals(req.user._id)) {
                res.status(403).json({ error: "Forbidden" })
                return
            }
            delete payload.createdBy
            
            const was = {...conference}
            conference.set({ ...conference, ...payload })
            await conference.save()
            await notifyConference(conference)
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