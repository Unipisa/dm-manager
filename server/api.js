
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

const hasSomeRole = (req, ...roles) => {
    return roles.some(role => req.roles.includes(role))
}

const requireSomeRole = (...roles) => ((req, res, next) => {
    requireRoles(req, res, () => {
        if (hasSomeRole(req, ...roles)) {
            next()
        } else {
            res.status(403)
            res.send({error: `not authorized (some role in ${roles.join(", ")} required, your roles: ${req.roles.join(", ")})`})
        }
    }
)})

router.get('/visit/:id', requireSomeRole('visit-manager','visit-supervisor','supervisor','admin'), async function(req, res) {
    try {
        let visit = await Visit.findById(req.params.id)
        res.send(visit)
    } catch(error) {
        console.error(error)
        res.status(404).send({error: error.message})
    }
})

router.patch('/visit/:id', requireSomeRole('visit-manager','admin'), async (req, res) => {
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

router.get('/visit', requireSomeRole('visit-manager','visit-supervisor','supervisor','admin'), async (req, res) => {
    let visits = await Visit.find()
    res.send({visits})
})

router.get('/public/visit/', async (req, res) => {
    try {
        let today = new Date()
        let tomorrow = today
        tomorrow.setDate(today.getDate() + 1)
        let visits = await Visit.find({
            startDate: {$lte: tomorrow},
            endDate: {$gte: today}
        })
        res.send({visits: visits.map(visit => ({
            startDate: visit.startDate,
            endDate: visit.endDate,
            firstName: visit.firstName,
            lastName: visit.lastName,
            affiliation: visit.affiliation,
            roomNumber: visit.roomNumber,
            building: visit.building,               
        }))})
    } catch(err) {
        res.status("500")
        res.send({ error: err.message })
    }
})

router.put('/visit', requireSomeRole('visit-manager','admin'), async (req, res) => {
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

router.get('/user/:id', requireSomeRole('supervisor', 'admin'), async function(req, res) {
    try {
        let user = await User.findById(req.params.id)
        res.send(user)
    } catch(err) {
        console.error(err)
        res.status(404)
    }
})

router.patch('/user/:id', requireSomeRole('admin'), async (req, res) => {
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

router.get('/user', requireSomeRole('supervisor', 'admin'), async (req, res) => {
    let users = await User.find()
    res.send({ users })
})

router.put('/user', requireSomeRole('admin'), async (req, res) => {
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

router.delete('/user/:id', requireSomeRole('admin'), async (req, res) => {
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
            if (!hasSomeRole(req, role)) {
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
    let filter = hasSomeRole(req, 'admin') ? {} : { createdBy: req.user }
    let tokens = await Token.find(filter).populate({path: 'createdBy', select: 'username'})
    res.send({ tokens })
})

router.delete('/token/:id', requireUser, async (req, res) => {
    console.log("token DELETE")
    let token = await Token.findById(req.params.id)
    if (token && (hasSomeRole(req, 'admin') || token.createdBy === req.user._id)) {
        token.delete()
        res.send({})
    } else {
        res.status(404)
        res.send({ error: 'token not found'})
    }
})

module.exports = router