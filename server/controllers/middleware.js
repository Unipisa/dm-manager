const Token = require('../models/Token')
const Log = require('../models/Log')

const log = async (req, was, will) => {
    await Log.create({
        who: req.log_who,
        when: new Date(),
        what: req.method,
        where: req.originalUrl,
        was,
        will})
}

const allowAnonymous = (req, res, next) => {
    req.log_who = '<anonymous>'
    next() 
}

const requireUser = (req, res, next) => {
    if (!req.user) {
        res.status(401)
        res.send({ error: `not logged in` })
    } else {
        req.roles = req.user.roles
        req.log_who = req.user.username
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
                req.roles = tok.roles || []
                req.log_who = tok.name || tok.token
                next()
            }
        })
    } else if (req.user) {
        req.roles = req.user.roles || []
        req.log_who = req.user.username
        next()
    } else {
        res.status(401)
        res.send({error: `not logged in`})
    }
}

const requirePathPermissions = async (req, res, next) => {
    const fullUrl = req.baseUrl + req.path
    const PREFIX = 'Bearer '
    if (! req.user) {
        // Check for token permission first
        if (req.headers.authorization?.startsWith(PREFIX)) {
            const token = req.headers.authorization.slice(PREFIX.length)
            tok = await Token.findOne({ token }).exec()
            if (! tok) {
                res.status(401)
                res.send({error: "invalid token"})
                return
            }
            else {
                req.roles = tok.roles || []
                req.log_who = tok.name || tok.token
            }
        }
        else {
            res.status(401)
            res.send({error: "not logged in"})
            return
        }
    }
    else {
        req.roles = req.user.roles
        req.log_who = req.user.username
    }

    // console.log(`checking permissions for ${req.log_who} with roles ${JSON.stringify(req.roles)} on ${fullUrl}`)

    const hasPermission = req.roles?.includes('admin') || req.roles.reduce(
        (x,y) => x || fullUrl.startsWith(`/api/v0${y}`), false
    )

    if (! hasPermission) {
        res.status(401).send({ error: 'not authorized' })
        return
    }

    next()
}

const hasSomeRole = (req, ...roles) => {
    if (!req.roles) return false
    if (roles.includes('@any-logged-user')) return true
    return roles.some(role => req.roles.includes(role))
}

const requireSomeRole = (...roles) => ((req, res, next) => {
    requireRoles(req, res, () => {
        if (hasSomeRole(req, ...roles)) {
            next()
        } else {
            res.status(403)
            const error = `some role in [${roles.join(", ")}] required, your roles: [${req.roles.join(", ")}]`
            console.log(error)
            res.send({error})
        }
    }
)})

module.exports = {log, requireUser, hasSomeRole, allowAnonymous, requireRoles, requireSomeRole, requirePathPermissions}