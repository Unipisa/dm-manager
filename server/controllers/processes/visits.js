const express = require('express')
const assert = require('assert')
const { ObjectId } = require('mongoose').Types

const Visit = require('../../models/Visit')
const RoomAssignment = require('../../models/RoomAssignment')
const EventSeminar = require('../../models/EventSeminar')
const { log } = require('../middleware')
const { notify } = require('../../models/Notification')
const config = require('../../config')

const router = express.Router()
module.exports = router

// inject functionality on the current route
require('./personSearch')(router)
require('./grantSearch')(router)
require('./roomAssignment')(router)

const DAYS_BACK = 30
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
        localField: 'person',
        foreignField: '_id',
        as: 'person',
    }},
    { $unwind: {
        path: '$person',
        preserveNullAndEmptyArrays: true,
    }},
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
    { $lookup: {
        from: 'people',
        localField: 'referencePeople',
        foreignField: '_id',
        as: 'referencePeople',
        pipeline: [
            { $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }},
        ]
    }}
]
module.exports.INDEX_PIPELINE = INDEX_PIPELINE

const GET_PIPELINE = [
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
    { $lookup: {
        from: 'people',
        localField: 'referencePeople',
        foreignField: '_id',
        as: 'referencePeople',
        pipeline: [
            { $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
            }},
        ]
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
                "createdBy": 1,
                "createdAt": 1,
            }},
            // tiene solo le assegnazioni che intersecano il periodo [start, end] 
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
            // espande createdBy
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
        ]
    }},
    {$lookup: {
        from: "eventseminars",
        let: { start: "$startDate", end: "$endDate" },
        localField: 'person._id',
        foreignField: "speaker",
        as: 'seminars',
        pipeline: [
            // tiene solo i seminari che intersecano il periodo [start, end] 
            {$match: {
                $expr: {
                    $and: [
                        { $or: [
                            { $eq: ["$$end", null] },
                            { $eq: ["$startDatetime", null] },
                            { $lte: ["$startDatetime", {$dateAdd: {startDate: "$$end", unit: "day", amount: 1}}] } ]},
                        { $or: [
                            { $eq: ["$$start", null] },
                            { $eq: ["$startDatetime", null] },
                            { $gte: ["$startDatetime", "$$start"] } ]}
                    ]},
                },
            },
            {$lookup: {
                from: 'seminarcategories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            }},
            {$unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }},
            {$lookup: {
                from: 'conferencerooms',
                localField: 'conferenceRoom',
                foreignField: '_id',
                as: 'conferenceRoom',
            }},
            {$unwind: {
                path: "$conferenceRoom",
                preserveNullAndEmptyArrays: true
            }},
            // espande createdBy
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
            {$project: {
                "startDatetime": 1,
                "title": 1,
                "category._id": 1,
                "category.name": 1,
                "category.label": 1,
                "abstract": 1,
                "grants": 1,
                "conferenceRoom._id": 1,
                "conferenceRoom.name": 1,
                "duration": 1,
                "createdBy": 1,
                "createdAt": 1,
            }},
            {$sort: {"startDatetime": 1}},
        ]
    }},
]
module.exports.GET_PIPELINE = GET_PIPELINE

async function notifyVisit(visit_id, message) {
    console.log(`notifyVisit ${visit_id}`)
    const visits = await Visit.aggregate([
        { $match: {_id: new ObjectId(visit_id)}},
        ...GET_PIPELINE,
    ])
    // console.log(JSON.stringify(visits,null,2))
    if (visits.length === 0) {
        console.log(`notifyVisit: visit ${visit_id} not found`)
        return
    }
    const visit = visits[0]

    const person = visit.person
    const affiliations = visit.affiliations.map(a => a.name).join(', ')
    const grants = visit.grants.map(g => g.name).join(', ')
    const startDate = visit.startDate.toLocaleDateString('it-IT')
    const endDate = visit.endDate.toLocaleDateString('it-IT')
    const tags = (visit.tags || []).join(', ')
    const notes = visit.notes
    const universityFunded = visit.universityFunded ? 'sì' : 'no'
    let text =  message || ''

    text +=`
Manage: ${config.BASE_URL}/process/visits/${visit_id}
${visit.referencePeople.map(p => `Referente: ${p.firstName} ${p.lastName} <${p.email}>`).join('\n')}
Visitatore: ${person.firstName} ${person.lastName}
Affiliazioni: ${affiliations}
Grants: ${grants}
Fondi di Ateneo: ${universityFunded}
Richiede stanza: ${visit.requireRoom ? 'sì' : 'no'}
Prevede seminario: ${visit.requireSeminar ? 'sì' : 'no'}
Data inizio: ${startDate}
Data fine: ${endDate}
Tags: ${tags}
Note: ${notes}
`
    for (ra of (visit?.roomAssignments || [])) {
        text += `
Assegnazione stanza: ${ra.room.code} edificio ${ra.room.building}, piano ${ra.room.floor}, stanza ${ra.room.number}
Data inizio: ${ra.startDate?.toLocaleDateString('it-IT')}
Data fine: ${ra.endDate?.toLocaleDateString('it-IT')}
Creato da: ${ra.createdBy?.username||'---'} il ${ra.createdAt?.toLocaleDateString('it-IT')}
        `
    }

    for(seminar of visit?.seminars || []) {
        text += `
Seminario: ${seminar.title}
Categoria: ${seminar.category.label}
Data inizio: ${seminar.startDatetime?.toLocaleDateString('it-IT')}
Durata: ${seminar.duration}
Sala: ${seminar.conferenceRoom.name}
Grants: ${seminar.grants.map(g => g.name).join(', ')}
${JSON.stringify(seminar)}
Creato da: ${seminar.createdBy?.username} il ${seminar.createdAt?.toLocaleDateString('it-IT')}
        `
    }

    console.log(text)

    await notify('process/visits', `${visit_id}`, text)
}

module.exports.notifyVisit = notifyVisit

router.get('/', async (req, res) => {    
    if (!req.user) {
        res.status(401).json({
            result: "Unauthorized"
        })
        return
    }

    const data = await Visit.aggregate([
        { $match: { 
            endDate: { $gte: pastDate() },
        }},
        ...INDEX_PIPELINE,
    ])

    res.json({ data, DAYS_BACK })
})

router.delete('/:id', async (req, res) => {
    assert(req.user._id)

    await notifyVisit(req.params.id, `La visita è stata cancellata`)

    const visit = await Visit.findOneAndDelete({
        _id: new ObjectId(req.params.id),
        endDate: { $gte: pastDate() },
    })
    if (!visit) return res.status(404)
    await log(req, visit, {})

    const roomAssignments = await RoomAssignment.aggregate([
        {$match: {
            person: visit.person,
            $expr: {
                $and: [
                    { $or: [
                        { $eq: [visit.endDate, null] },
                        { $eq: ["$startDate", null] },
                        { $lte: ["$startDate", visit.endDate] } ]},
                    { $or: [
                        { $eq: [visit.startDate, null] },
                        { $eq: ["$endDate", null] },
                        { $gte: ["$endDate", visit.startDate] } ]}
                ]},
            },
        },
    ])
    for (const roomAssignment of roomAssignments) {
        await RoomAssignment.deleteOne({ _id: roomAssignment._id })
        await log(req, roomAssignment, {})
    }

    const seminarsPipeline = [
        { $match: { 
            speaker: visit.person,
            $expr: {
                $and: [
                    { $or: [
                        { $eq: [visit.endDate, null] },
                        { $eq: ["$startDatetime", null] },
                        { $lte: ["$startDatetime", visit.endDate] } ]},
                    { $or: [
                        { $eq: [visit.startDate, null] },
                        { $eq: ["$startDatetime", null] },
                        { $gte: ["$startDatetime", visit.startDate] } ]}
            ]},
        }}
    ]

    const seminars = await EventSeminar.aggregate(seminarsPipeline)
    for (const seminar of seminars) {
        await EventSeminar.deleteOne({ _id: seminar._id })
        await log(req, seminar, {})
    }

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
            endDate: { $gte: pastDate() },
        }},
        ...GET_PIPELINE,
    ])
    if (data.length === 0) {
        res.status(404).json({ error: "Not found" })
        return
    }
    res.json(data[0])
})

// TODO: should be "post" instead of "put"
router.put('/', async (req, res) => {
    const payload = {...req.body}

    // override fields that user cannot change
    payload.createdBy = req.user._id
    payload.updatedBy = req.user._id
    delete payload._id

    if (!payload.endDate || new Date(payload.endDate) < pastDate()) {
        return res.status(422).json({ error: `endDate cannot be more than ${DAYS_BACK} days in the past` })
    }

    const visit = new Visit(payload)
    await visit.save()

    await log(req, {}, payload)
    notifyVisit(visit._id)

    res.send({_id: visit._id})
})

router.patch('/:id', async (req, res) => {
    const payload = {...req.body}

    // remove fields that user cannot change
    delete payload._id
    delete payload.createdBy
    payload.updatedBy = req.user._id

    const visit = await Visit.findOneAndUpdate(
        {   _id: new ObjectId(req.params.id),
            endDate: { $gte: pastDate() }}, 
        payload)

    if (!visit) return res.status(404)

    await log(req, visit, payload)
    notifyVisit(visit._id)

    res.send({})
})
