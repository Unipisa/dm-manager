const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const EventConference = require('../../models/EventConference')
const Person = require('../../models/Person')

const InstitutionController = require('../InstitutionController')
const EventConferenceController = require('../EventConferenceController')
const GrantController = require('../GrantController')
const controller = new EventConferenceController()
const {log} = require('../middleware')
const { notify } = require('../../models/Notification')

/* inject functionality for widgets */
require('./personSearch')(router)
require('./conferenceRoomSearch')(router)

async function notifyConference(conference) {
    const notificationText = (conference) => `
    È stato creato o modificato un convegno${conference.organizers ? ' per il quale sei organizzatore' : ''}. 

    Il titolo del convegno è: ${conference.title}.

    Il link per visualizzare il convegno sul sito del Dipartimento è: https://www.dm.unipi.it/en/conference/?id=${conference._id}

    Il convegno su Manage si trova al seguente link: https://manage.dm.unipi.it/event-conference/${conference._id}
    `;

    // notify all organizers
    if (conference.organizers && conference.organizers.length > 0) {
        const organizers = await Person.find({ _id: { $in: conference.organizers } });
        for (const organizer of organizers) {
            if (!organizer.email) continue;
            const text = notificationText(conference);
            await notify(organizer.email, `${conference._id}`, text);
        }
    }

    const generalText = notificationText(conference);
    await notify('process/conferences', `${conference._id}`, generalText);
}

router.get('/', async (req, res) => {
    if (req.user === undefined) {
        return res.status(401).json({
            result: "Unauthorized"
        })
    }
    let authorization_alternatives = [
        { createdBy: req.user._id },
    ]
    if (req?.person?._id) authorization_alternatives.push({ organizers: new ObjectId(req.person._id) })

    const pipeline = [
        {$match: {
            $or: authorization_alternatives
        }},
        ...controller.queryPipeline,
    ]
    const data = await EventConference.aggregate(pipeline)

    return res.send({
        data,
        // person: req.person,
    })
    // era: controller.performQuery({ createdBy: req.user._id }, res)
})


router.delete('/:id', async (req, res) => {
    try {
        const conference = await EventConference.findById(new ObjectId(req.params.id))
        let user_is_organizer = false
        if (conference.organizers && conference.organizers.length > 0) {
            const organizers = await Person.find({ _id: { $in: conference.organizers }})
            user_is_organizer = req.person && organizers.some(o => o._id.equals(req.person._id))
        }

        const user_is_creator = req.user.equals(conference.createdBy)

        if (user_is_creator || user_is_organizer) {
            await conference.delete()
            await log(req, conference, {})
            res.json({})
        } else {
            res.status(401).json({
                error: "Cannot delete conferences created by other users or not in the organizers list"
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
    if (req?.person?._id) authorization_alternatives.push({ organizers: new ObjectId(req.person._id) })

    const pipeline = [
        {$match: {
            _id: new ObjectId(req.params.id),
            $or: authorization_alternatives
        }},
        ...controller.queryPipeline,
    ]

    const data = await EventConference.aggregate(pipeline)

    return res.send({
        data,
        // person: req.person,
    })
/*
    controller.performQuery({
        _id: req.params.id, 
        createdBy: req.user._id
    }, res)*/
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
        if (conference.organizers && conference.organizers.length > 0) {
            const organizers = await Person.find({ _id: { $in: conference.organizers } })

            const user_is_creator = req.user.equals(conference.createdBy)
            const user_is_organizer = req.person && organizers.find(o => o._id.equals(req.person._id))
    
            if (!user_is_creator && !user_is_organizer) {
                res.status(403).json({ error: "Forbidden" })
                return
            }
        } else {
            const user_is_creator = req.user.equals(conference.createdBy)
            if (!user_is_creator) {
                res.status(403).json({ error: "Forbidden" })
                return
            }
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
            if (conference.organizers && conference.organizers.length > 0) {
                const organizers = await Person.find({ _id: { $in: conference.organizers } })
                
                const user_is_creator = req.user.equals(conference.createdBy)
                const user_is_organizer = req.person && organizers.find(o => o._id.equals(req.person._id))
        
                if (!user_is_creator && !user_is_organizer) {
                    res.status(403).json({ error: "Forbidden" })
                    return
                }
            } else {
                const user_is_creator = req.user.equals(conference.createdBy)
                if (!user_is_creator) {
                    res.status(403).json({ error: "Forbidden" })
                    return
                }
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