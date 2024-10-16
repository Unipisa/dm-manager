const express = require('express')
const assert = require('assert')
const { ObjectId } = require('mongoose').Types

const Url = require('../../models/Url')
const { log } = require('../middleware')

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

router.delete('/:id', async (req, res) => {
    console.log(`my DELETE ${req.params.id}`)
    try {
        const url = await Url.findById(new ObjectId(req.params.id))

        const user_is_creator = req.user.equals(url.createdBy)

        if (user_is_creator) {
            await url.delete()
            await log(req, url, {})
            res.json({})
        }
        else {
            res.status(401).json({
                error: "Cannot delete urls created by other users"
            })
        }
    } catch(error) {
        res.status(400).json({
            error: error.message
        })
    }
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
    const urls = await Url.aggregate([{
        $match: { alias }
    }])
    console.log(`is_alias_unused(${alias}) ... ${JSON.stringify(urls)}`)
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

async function check_url(url, old_alias=null) {
    if (!is_alias_sane(url.alias)) return "alias is not valid"
    if (!is_destination_sane(url.destination)) return "destination is not valid"
    if (url.alias !== old_alias && !await is_alias_unused(url.alias)) return "alias is already used"
    return null
}

function get_matricola(req) {
    const staffs = req.staffs
    let matricola = null
    for (staff of staffs) {
        if (staff.matricola) {
            if (matricola) return false
            matricola = staff.matricola
        }
    }
    if (!matricola) return null
    return matricola
}

router.patch('/:id', async (req, res) => {
    const id = req.params.id
    const matricola = get_matricola(req)

    if (matricola === false) return res.status(403).send({ error: 'duplicate staff found'})
    if (!matricola === null) return res.status(403).send({ error: 'no staff found'})

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

        const error = await check_url({...url, ...payload}, url.alias)

        if (error) return res.status(400).json({error})

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

router.put('/', async (req, res) => {    
    const matricola = get_matricola(req)
    if (!req.user) return res.status(403).json({error: "user not authenticated"})
    if (matricola === false) return res.status(403).send({ error: 'duplicate staff found'})
    if (!matricola === null) return res.status(403).send({ error: 'no staff found'})

    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        owner: matricola
    }

    const error = await check_url(payload)
    if (error) return res.status(400).json({error})

    try {
        const url = Url(payload)

        await url.save()
//        await notifySeminar(seminar)
        await log(req, {}, payload)
        res.send({})
    }
    catch (error) {
        res.status(400).send({ error: error.message })
    }
})

