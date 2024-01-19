const express = require('express')
const router = express.Router()
const {ObjectId} = require('mongodb')

const RoomLabel = require('../../models/RoomLabel')
const {log} = require('../middleware')

module.exports = router

router.get('/', async (req, res) => {    
    const labels = await RoomLabel.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
                pipeline: [{$project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                }}]
            }
        }, {
            $unwind: {
                path: '$createdBy',
                preserveNullAndEmptyArrays: true,
            }
        }, {
            $lookup: {
                from: 'users',
                localField: 'updatedBy',
                foreignField: '_id',
                as: 'updatedBy',
                pipeline: [{$project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                }}]
            }}, {
                $unwind: {
                    path: '$updatedBy',
                    preserveNullAndEmptyArrays: true,
                }
        },  {
            $sort: {
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
    await log(req, {}, payload)
    res.json({})
})

router.patch('/:id', async (req, res) => {
    const {id} = req.params
    let _id
    try {
        _id = new ObjectId(id)
    } catch (e) {
        return res.status(400).json({error: "invalid id"})
    }
    const state = req.body.state

    if (!state) res.status(400).json({error: "state is required"})
    
    const was = await RoomLabel.findOne({_id})
    const will = {
        state,
        updatedBy: req.user._id,
    }
    
    await RoomLabel.updateOne({_id}, will)
    await log(req, was, will)
    
    res.json({})
})

router.delete('/:id', async (req, res) => {
    const {id} = req.params
    let _id
    try {
        _id = new ObjectId(id)
    } catch (e) {
        return res.status(400).json({error: "invalid id"})
    }
    const was = await RoomLabel.findOne({_id})
    await RoomLabel.deleteOne({_id})
    await log(req, was, {})
    res.json({data: id})
})
