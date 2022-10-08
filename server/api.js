
var express = require('express')

const Visit = require('./models/Visit')
const User = require('./models/User')

var router = express.Router()

const requireRole = role => ((req, res, next) => {
    if (!req.user) {
        res.status(401)
        res.send(`not logged in`)
    } else if (req.user.roles && (
        req.user.roles.includes(role) 
        || req.user.roles.includes('admin'))) {
        next()
    } else {
        res.status(403)
        res.send(`not authorized (${role} required)`)
    }
})

router.get('/visit/:id', requireRole('visit-manager'), async function(req, res) {
    try {
        let visit = await Visit.findById(req.params.id)
        res.send(visit)
    } catch(err) {
        console.error(err)
        res.status(404)
    }
})

router.patch('/visit/:id', requireRole('visit-manager'), async (req, res) => {
    const payload = req.body
    try {
        console.log(`payload: ${JSON.stringify(payload)}`)
        const visit = await Visit.findByIdAndUpdate(req.params.id, payload)
        res.send(visit)
    } catch(err) {
        console.error(err)
        res.status(400).send({error: err.message})
    }
})

router.get('/visit', requireRole('visit-manager'), async (req, res) => {
    let visits = await Visit.find()
    res.send({visits})
})

router.put('/visit', requireRole('visit-manager'), async (req, res) => {
    try {
        await Visit.create(req.body)
        res.send({})
    } catch(err) {
        console.error(err)
        res.status(400).send({ error: err.message })
    }
})

router.get('/user/:id', requireRole('admin'), async function(req, res) {
    try {
        let user = await User.findById(req.params.id)
        res.send(user)
    } catch(err) {
        console.error(err)
        res.status(404)
    }
})

router.patch('/user/:id', requireRole('admin'), async (req, res) => {
    const payload = req.body
    try {
        console.log(`patch payload: ${JSON.stringify(payload)}`)
        const user = await User.findByIdAndUpdate(req.params.id, payload)
        console.log(`patched: ${JSON.stringify(user)}`)
        res.send(user)
    } catch(err) {
        console.error(err)
        res.status(400).send({error: err.message})
    }
})

router.get('/user', requireRole('admin'), async (req, res) => {
    let users = await User.find()
    res.send({ users })
})

router.put('/user', requireRole('admin'), async (req, res) => {
    try {
        await User.create(req.body)
        res.send({})
    } catch(err) {
        console.error(err)
        res.status(400).send({ error: err.message })
    }
})


module.exports = router