const express = require('express')
const assert = require('assert')
const { ObjectId } = require('mongoose').Types

const Url = require('../../models/Url')
const { log } = require('../middleware')
const { notify } = require('../../models/Notification')
const config = require('../../config')
const { createdBy } = require('../../models/Model')

const router = express.Router()
module.exports = router


router.get('/', async (req, res) => {    
    if (!req.user) {
        res.status(401).json({
            result: "Unauthorized"
        })
        return
    }

    const data = await Url.aggregate([
        {$match: {createdBy: req.user._id}}
    ])

    res.json({ data })
})

router.get('/:id', async (req,res) => {
    assert(req.user._id)
    if (req.params.id === '__new__') {
        // return empty object
        const url = new Url().toObject()
        url._id = undefined
        return res.json(url)
    }
    let _id
    try {
        _id = new ObjectId(req.params.id)
    } catch(error) {
        return res.status(400).json({ error: `Invalid id: ${req.params.id}` })
    }
    const data = await Url.aggregate([
        { $match: { 
            _id,
            createdBy: req.user._id
        }},
    ])
    if (data.length === 0) {
        res.status(404).json({ error: "Not found" })
        return
    }
    res.json(data[0])
})

