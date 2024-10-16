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

async function is_alias_unused(alias) {
    const urls = Url.aggregate([{
        $match: { alias }
    }])
    return urls.length === 0
}

function is_alias_sane(alias) {
    // check that alias is composed by alphanumeric characters and -_,
    // can contain / but not as a first character
    const regex = /^[a-zA-Z0-9_\-][a-zA-Z0-9_\-/]*$/
    return regex.test(alias)
}

function is_destination_sane(destination) {
    // check that destination is composed by alphanumeric characters and -_,
    // can contain / but not as a first character
    const regex = /^[a-zA-Z0-9_\-][a-zA-Z0-9_\-/]*$/
    return regex.test(destination)
}

router.patch('/:id', async (req, res) => {
    const id = req.params.id
    const staffs = req.staffs
    let matricola = null
    for (staff of staffs) {
        if (staff.matricola) {
            if (matricola) return res.status(403).send({ error: 'duplicate staff found'})
            matricola = staff.matricola
        }
    }
    if (!matricola) return res.status(403).send({ error: 'no staff found'})

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
        owner: matricola,
    }

    try {
        const url = await Url.findById(_id)
        const user_is_creator = req.user.equals(url.createdBy)
        const user_is_owner = url.owner === matricola
        const user_is_admin = req.roles.includes('admin')

        if (!user_is_admin && !(user_is_creator && user_is_owner)) {
            return res.status(403).json({ error: `Forbidden`, user_is_admin, user_is_creator, user_is_owner })
        }

        if (req.body.alias !== undefined && req.body.alias !== url.alias) {
            if (!is_alias_unused(req.body.alias)) return res.status(400).json({error: "duplicated alias", alias: req.body.alias})
        }

        if (req.body.alias !== undefined && !is_alias_sane(req.body.alias)) {
            return res.status(400).json({error: "invalid alias", alias: req.body.alias})
        }

        if (req.body.destination !== undefined && !is_destination_sane(req.body.destination)) {
            return res.status(400).json({error: "invalid destination", destination: req.body.destination})
        }

        const was = {...url}
        url.set({ ...url, ...payload })
        await url.save()
//        await notifySeminar(seminar)
        await log(req, was, payload)
        res.send({})
    }
    catch (error) {
        res.status(400).send({ error: error.message })
    }
})
