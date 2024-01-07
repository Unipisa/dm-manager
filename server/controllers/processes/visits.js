const express = require('express')
const assert = require('assert')
const { ObjectId } = require('mongoose').Types

const Visit = require('../../models/Visit')
const Grant = require('../../models/Grant')
const { escapeRegExp } = require('../Controller')
const { log } = require('../middleware')

const router = express.Router()

// inject functionality for the person select widget
require('./personSearch')(router)

// inject room assignment functionality
// require('./roomAssignment')(router)

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
        }},
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true,
        }},
        {$lookup: {
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
    ])

    res.json({ data })
})

router.delete('/:id', async (req, res) => {
    let visit 
    try {
        visit = await Visit.findById(new ObjectId(req.params.id))
    } catch(error) {
        return res.status(400).json({
            error: error.message,
            id: req.params.id
        })
    }

    if (!req.user._id.equals(visit.createdBy)) {
        return res.status(403).json({
            error: "Cannot delete visit created by other users"
        })
    }

    await visit.delete()
    log(req, visit, {})
    res.json({})
    })

router.get('/:id', async (req, res) => {
    assert(req.user._id)
    if (req.params.id === '__new__') {
        // return empty object
        const visit = new Visit().toObject()
        visit._id = undefined
        return res.json(visit)
    }
    let _id
    try {
        _id = new ObjectId(req.params.id)
    } catch(error) {
        return res.status(400).json({ error: `Invalid id: ${req.params.id}` })
    }
    const data = await Visit.aggregate([
        { $match: { 
            _id,
            createdBy: req.user._id,
        } },
        { $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'person',
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
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true,
        }},
        {$lookup: {
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
        {$lookup: {
            from: 'grants',
            localField: 'grants',
            foreignField: '_id',
            as: 'grants',
            pipeline: [
                { $project: {
                    _id: 1,
                    name: 1,
                    identifier: 1,
                }},
            ]
        
        }},
        {$lookup: {
            from: "roomassignments",
            let: { start: "$startDate", end: "$endDate" },
            localField: 'person._id',
            foreignField: "person",
            as: 'roomAssignments',
            pipeline: [
                // inserisce i dati della stanza
                {$lookup: {
                    from: "rooms",
                    localField: "room",
                    foreignField: "_id",
                    as: "room",
                }},
                {$project: {
                    "startDate": 1,
                    "endDate": 1,
                    "room._id": 1,
                    "room.code": 1,
                    "room.building": 1,
                    "room.floor": 1,
                    "room.number": 1,
                }},
                // tiene solo le assegnazioni che includono il periodo [start, end] 
                {$match: {
                    $expr: {
                        $and: [
                            { $or: [
                                { $eq: ["$$end", null] },
                                { $eq: ["$startDate", null] },
                                { $lte: ["$startDate", "$$end"] } ]},
                            { $or: [
                                { $eq: ["$$start", null] },
                                { $eq: ["$endDate", null] },
                                { $gte: ["$endDate", "$$start"] } ]}
                        ]},
                    },
                },
                {$unwind: {
                    path: "$room",
                    preserveNullAndEmptyArrays: true
                }},
                // ordina per data finale...
                // l'ultima assegnazione dovrebbe essere quella attuale
                {$sort: {"endDate": 1}},
            ]
        }},
    ])
    if (data.length === 0) {
        res.status(404).json({ error: "Not found" })
        return
    }
    res.json(data[0])
})

router.put('/', async (req, res) => {
    const payload = {...req.body}

    // override fields that user cannot change
    payload.createdBy = req.user._id
    payload.updatedBy = req.user._id
    delete payload._id

    const visit = new Visit(payload)
    await visit.save()

    log(req, {}, payload)

    res.send({_id: visit._id})
})

router.patch('/:id', async (req, res) => {
    const payload = {...req.body}

    // remove fields that user cannot change
    delete payload._id
    delete payload.createdBy
    payload.updatedBy = req.user._id

    const visit = await Visit.findById(req.params.id)
    
    // check that the visit belongs to the user
    if (!visit.createdBy.equals(req.user._id)) {
        res.status(403).json({ error: "Forbidden" })
        return
    }
        
    // patch the visit
    const was = {...visit}
    visit.set({ ...visit, ...payload })
    try {
        console.log(`saving visit: ${JSON.stringify({visit, id: req.params.id})}`)
        await visit.save()
    } catch(error) {
        return res.status(400).json({ error: error.message })
    }
    await log(req, was, payload)

    res.send({})
})

router.get('/grant/search', async (req, res) => {
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