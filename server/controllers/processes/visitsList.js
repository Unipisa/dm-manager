const express = require('express')
const assert = require('assert')
const { ObjectId } = require('mongoose').Types

const Visit = require('../../models/Visit')
const RoomAssignment = require('../../models/RoomAssignment')
const EventSeminar = require('../../models/EventSeminar')
const { log } = require('../middleware')
const { notify } = require('../../models/Notification')
const config = require('../../config')

const { INDEX_PIPELINE, ROOM_ASSIGNMENTS_LOOKUP, DAYS_BACK, pastDate} = require('./visits')

const router = express.Router()
module.exports = router

router.get('/', async (req, res) => {    
    if (!req?.user?.person) {
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
        ROOM_ASSIGNMENTS_LOOKUP
    ])

    res.json({ data, DAYS_BACK })
})
