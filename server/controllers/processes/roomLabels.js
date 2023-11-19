const express = require('express')
const router = express.Router()
const {ObjectId} = require('mongodb')

const RoomLabel = require('../../models/RoomLabel')

module.exports = router

router.get('/', async (req, res) => {    
    const labels = await RoomLabel.aggregate([
        {
            '$sort': {
                'updatedAt': -1,
            }
        }
    ])
    res.json({data: labels})
})

router.post('/', async (req, res) => {
    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    }
    const label = new RoomLabel(payload)
    await label.save()
    res.json({})
})

router.patch('/:id', async (req, res) => {
    const {id} = new ObjectId(req.params)
    const state = req.body.state
    if (!state) res.status(400).json({error: "state is required"})
    await RoomLabel.updateOne({_id: new ObjectId(id)}, {
        state,
        updatedBy: req.user._id,
    })
    res.json({})
})

router.delete('/:id', async (req, res) => {
    console.log(`deleting ${req.params.id}`)
    const {id} = req.params
    await RoomLabel.deleteOne({_id: new ObjectId(id)})
    res.json({data: id})
})
