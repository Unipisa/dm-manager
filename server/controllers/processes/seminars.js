const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const EventSeminar = require('../../models/EventSeminar')

const InstitutionController = require('../InstitutionController')
const EventSeminarController = require('../EventSeminarController')
const GrantController = require('../GrantController')
const Person = require('../../models/Person')
const Visit = require('../../models/Visit')
const controller = new EventSeminarController()
const {log} = require('../middleware')
const { notify } = require('../../models/Notification')
const { Speaker } = require('react-bootstrap-icons')

/* inject functionality for widgets */
require('./personSearch')(router)
require('./conferenceRoomSearch')(router)
require('./seminarCategorySearch')(router)

async function notifySeminar(seminar) {
    
    // notify all organizers
    if (seminar.organizers && seminar.organizers.length > 0) {
        const organizers = await Person.find({ _id: { $in: seminar.organizers }})
        for (const organizer of organizers) {
            if (!organizer.email) continue
            const text = `
È stato creato o modificato un seminario per il quale sei organizzatore. 

Il titolo del seminario è: ${seminar.title}.

Il link per visualizzare il seminario sul sito del Dipartimento è: https://www.dm.unipi.it/en/seminar/?id=${seminar._id}.

Gli organizzatori possono visualizzare il seminario su Manage al seguente link: https://manage.dm.unipi.it/process/seminars/add/${seminar._id}.

Gli amministratori possono visualizzare il seminario su Manage al seguente link: https://manage.dm.unipi.it/event-seminar/${seminar._id}.
        `
            await notify(organizer.email, `${seminar._id}`, text)
        }
    }

    // notification for related visitor

    // For matching visitors, we only care about the days, and ignore the actual time 
    // at which the seminar is scheduled.
    const startDate = new Date(seminar.startDatetime); startDate.setHours(0)
    const endDate = new Date(seminar.startDatetime); endDate.setHours(0)

    // Find out if the seminar is given by a visitor; if that is the case, people 
    // with a notify/process/visit permission should be notified.
    const pipeline = [
        { $match: {
            startDate: { $lte: startDate },
            endDate: { $gte: endDate },
            publish: true, 
            person: { $in: seminar.speakers },
        }}, 
        { $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'person',
        }},
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true,
        }}
    ]
    console.log(JSON.stringify(pipeline, null, 2))
    const visits = await Visit.aggregate(pipeline)

    visits.map(async (v) => {
        const startDate = v.startDate.toLocaleDateString('it-IT')
        const endDate = v.endDate.toLocaleDateString('it-IT')

        const text = `
È stato creato o modificato un seminario per l'ospite ${v.person.firstName} ${v.person.lastName}, 
in visita da ${startDate} a ${endDate}.

Il titolo del seminario è ${seminar.title}.

Il link per visualizzare il seminario sul sito del Dipartimento è: https://www.dm.unipi.it/en/seminar/?id=${seminar._id}.

Gli organizzatori possono visualizzare il seminario su Manage al seguente link: https://manage.dm.unipi.it/process/seminars/add/${seminar._id}.

Gli amministratori possono visualizzare il seminario su Manage al seguente link: https://manage.dm.unipi.it/event-seminar/${seminar._id}.
        `;
        await notify('process/visits', `${v._id}`, text)
    })

}

router.get('/', async (req, res) => {    
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
    console.log(JSON.stringify({seminar_pipeline: pipeline}, null, 2))
    const data = await EventSeminar.aggregate(pipeline)

    return res.send({
        data,
        person: req.person,
    })
    // era: controller.performQuery({ createdBy: req.user._id }, res)
})

router.delete('/:id', async (req, res) => {
    try {
        const seminar = await EventSeminar.findById(new ObjectId(req.params.id))
        const organizers = await Person.find({ _id: { $in: seminar.organizers }})

        const user_is_creator = req.user.equals(seminar.createdBy)
        const user_is_organizer = req.person && organizers.find(o => o._id.equals(req.person._id))

        if (user_is_creator || user_is_organizer) {
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
    
    const data = await EventSeminar.aggregate(pipeline)

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
        const seminar = EventSeminar(payload)
        await seminar.save()
        await notifySeminar(seminar)
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
        const organizers = await Person.find({ _id: { $in: seminar.organizers }})

        const user_is_creator = req.user.equals(seminar.createdBy)
        const user_is_organizer = req.person && organizers.find(o => o._id.equals(req.person._id))

        if (!req.roles.includes('admin') && !user_is_creator && !user_is_organizer) {
            return res.status(403).json({ error: "Forbidden" })
        }
        
        const was = {...seminar}
        seminar.set({ ...seminar, ...payload })
        await seminar.save()
        await notifySeminar(seminar)
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
            await notifySeminar(seminar)
            await log(req, {}, payload)
        }
        else {
            const seminar = await EventSeminar.findById(payload._id)
            const organizers = await Person.find({ _id: { $in: seminar.organizers }})

            const user_is_creator = req.user.equals(seminar.createdBy)
            const user_is_organizer = req.person && organizers.find(o => o._id.equals(req.person._id))

            if (!user_is_creator && !user_is_organizer) {
                res.status(403).json({ error: "Forbidden" })
                return
            }
            delete payload.createdBy
            
            const was = {...seminar}
            seminar.set({ ...seminar, ...payload })
            await seminar.save()
            await notifySeminar(seminar)
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