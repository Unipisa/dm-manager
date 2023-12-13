// Endpoint utilizzati per la gestione delle planimetrie
const express = require('express')
const router = express.Router()

const {ObjectId} = require('mongodb')
const Room = require('../../models/Room')

router.get('/', async (req, res) => {
    // Find all rooms, and return only the data required for the planimetrie module
    const rooms = await Room.aggregate([
        {$project: {
            _id: 1, 
            name: 1,
            notes: 1,
            code: 1, 
            polygon: 1
        }}
    ])

    res.json({ 
        data: rooms
    })
})

router.get('/:id', async (req, res) => {
    const id = new ObjectId(req.params.id)

    const room = await Room.aggregate([
        {$match: { _id: id }},
        {$project: {
            _id: 1, 
            name: 1,
            notes: 1,
            code: 1, 
            polygon: 1
        }}
    ])

    res.json({ 
        data: room
    })
})

router.post('/:id', async (req, res) => {
    const notes = req.body.notes
    const polygon = req.body.polygon
    const id = new ObjectId(req.params.id)

    const newdata = {}
    if (notes) { newdata.notes = notes }
    if (polygon) { newdata.polygon = polygon }

    const ok = await Room.updateOne({ _id: id }, newdata)

    if (ok.modifiedCount == 1) {
        res.json({})
    }
    else {
        res.json({
            error: "An error was encountered during the update, and no rooms were modified"
        })
    }
})


module.exports = router