
var express = require('express')

const Visit = require('./models/Visit')
const User = require('./models/User')
const Token = require('./models/Token')
const { AuthorizationError } = require('passport-oauth2')

var router = express.Router()

const requireUser = (req, res, next) => {
    if (!req.user) {
        res.status(401)
        res.send({ error: `not logged in` })
    } else {
        req.roles = req.user.roles
        next()
    }
}

const requireRoles = (req, res, next) => {
    if (req.roles !== undefined) next()
    const PREFIX = 'Bearer '
    if (req.headers.authorization?.startsWith(PREFIX)) {
        const token = req.headers.authorization.slice(PREFIX.length)
        Token.findOne({ token }, (err, tok) => {
            if (err) {
                res.status(401)
                res.send({error: "invalid token"})
            } else {
                req.roles = token.roles
                next()
            }
        })
    } else if (req.user) {
        req.roles = req.user.roles
        next()
    } else {
        res.status(401)
        res.send({error: `not logged in`})
    }
}

const hasRole = (req, role) => (req.roles.includes(role) || req.roles.includes('admin'))

const requireRole = role => ((req, res, next) => {
    requireRoles(req, res, () => {
        if (hasRole(req, role)) {
            next()
        } else {
            res.status(403)
            res.send({error: `not authorized (role "${role}" required)`})
        }
    }
)})

router.get('/visit/:id', requireRole('visit-manager'), async function(req, res) {
    try {
        let visit = await Visit.findById(req.params.id)
        res.send(visit)
    } catch(error) {
        console.error(error)
        res.status(404).send({error: error.message})
    }
})

router.patch('/visit/:id', requireRole('visit-manager'), async (req, res) => {
    const payload = {...req.body,
        updatedBy: req.user._id
    }
    delete payload.createdBy
    delete payload.createdAt
    delete payload.updatedAt

    try {
        const visit = await Visit.findByIdAndUpdate(req.params.id, payload)
        res.send(visit)
    } catch(error) {
        console.error(error)
        res.status(400).send({error: err.message})
    }
})

router.get('/visit', requireRole('visit-manager'), async (req, res) => {
    let visits = await Visit.find()
    res.send({visits})
})

router.put('/visit', requireRole('visit-manager'), async (req, res) => {
    let payload = {
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    }
    delete payload.createdAt
    delete payload.updatedAt

    try {
        await Visit.create(payload)
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
    const payload = {...req.body,
        updatedBy: req.user._id
    }
    delete payload.createdBy
    delete payload.createdAt
    delete payload.updatedAt

    try {
        const user = await User.findByIdAndUpdate(req.params.id, payload)
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
    let payload = { ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id
    }
    delete payload.createdAt
    delete payload.updatedAt

    try {
        await User.create(payload)
        res.send({})
    } catch(err) {
        console.error(err)
        res.status(400).send({ error: err.message })
    }
})

router.delete('/user/:id', requireRole('admin'), async (req, res) => {
    try {
        await User.deleteOne({_id: req.params.id})
        res.send({})
    } catch(err) {
        console.error(err)
        res.status(400).send({ error: err.message })
    }
})

router.put('/token', requireUser, async (req, res) => {
    let payload = {
        roles: [], 
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id
    }
    delete payload.createdAt
    delete payload.updatedAt
    delete payload.token

    try {
        payload.roles.forEach(role => {
            if (!hasRole(req, role)) {
                res.status(403).send({ error: `cannot create Token with role "${role}" which you don't have`})
                return
            }
        })
        const token = await Token.create(payload)
        res.send({ token })
    } catch(err) {
        console.error(err)
        res.status(400).send({ error: err.message })
    }
})

router.get('/token', requireUser, async (req, res) => {
    let filter = hasRole(req, 'admin') ? {} : { createdBy: req.user }
    let tokens = await Token.find(filter)
    res.send({ tokens })
})

router.delete('/token/', requireUser, async (req, res) => {
    console.log("token DELETE")
    let token = await Token.findById(req.params.id)
    if (token && (hasRole(req, 'admin') || token.createdBy === req.user._id)) {
        token.delete()
        res.send({})
    } else {
        res.status(404)
        res.send({ error: 'token not found'})
    }
})

module.exports = router