const express = require('express')
const assert = require('assert')
const { ObjectId } = require('mongoose').Types

const Visit = require('../../models/Visit')
const Person = require('../../models/Person')
const Grant = require('../../models/Grant')
const Institution = require('../../models/Institution')
const PersonController = require('../PersonController')
const { escapeRegExp } = require('../Controller')
const { log } = require('../middleware')

const router = express.Router()

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

router.put('/add/person', async (req, res) => {
    const controller = new PersonController()
    await controller.put(req, res)
})

router.delete('/:id', async (req, res) => {
    try {
        const visit = await Visit.findById(new ObjectId(req.params.id))

        if (req.user._id.equals(visit.createdBy)) {
            await visit.delete()
            log(req, visit, {})
            res.json({})
        }
        else {
            res.status(403).json({
                error: "Cannot delete visit created by other users"
            })
        }
    } catch(error) {
        res.status(400).json({
            error: error.message
        })
    }
})

router.get('/get/:id', async (req, res) => {
    assert(req.user._id)
    if (req.params.id === '__new__') {
        // return empty object
        const visit = new Visit().toObject()
        visit._id = undefined
        return res.json(visit)
    }
    const data = await Visit.aggregate([
        { $match: { 
            _id: new ObjectId(req.params.id),
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
        
        }}
    ])
    if (data.length === 0) {
        res.status(404).json({ error: "Not found" })
        return
    }
    res.json(data[0])
})


router.put('/save', async (req, res) => {
    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    }

    if (! payload._id) {
        const visit = new Visit(payload)
        await visit.save()
        log(req, {}, payload)
    }
    else {
        const visit = await Visit.findById(payload._id)
        if (!visit.createdBy.equals(req.user._id)) {
            res.status(403).json({ error: "Forbidden" })
            return
        }
        const was = {...visit}
        delete visit.createdBy
        
        visit.set({ ...visit, ...payload })
        await visit.save()
        await log(req, was, payload)
    }
    res.send({})
})

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

router.get('/add/institution/search', async (req, res) => {
    const $regex = new RegExp(escapeRegExp(req.query.q), 'i')
    const data = await Institution.aggregate([
        { $match: {$or: [
            {name: { $regex } },
            {alternativeNames: { $regex }},
            {code: { $regex }},
            {city: { $regex }},
            {country: { $regex }},
        ]}},
        { $project: {
            _id: 1,
            name: 1,
        }},
    ])
    res.json({ data })
})

router.put('/add/institution', async (req, res) => {
    try {
        const institution = new Institution({
            ...req.body,
            createdBy: req.user._id,
            updatedBy: req.user._id,
        })
    } catch(error) {
        res.status(400).json({ error: error.message })
    }
    res.json(institution)
})

module.exports = router