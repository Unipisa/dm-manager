const Token = require('../models/Token')
const Log = require('../models/Log')

const log = (req, was, will) => {
    Log.create({
        who: req.log_who,
        when: new Date(),
        what: req.method,
        where: req.path,
        was,
        will})
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

const hasSomeRole = (req, ...roles) => {
    return roles.some(role => (req.roles && req.roles.includes(role)))
}

const requireSomeRole = (...roles) => ((req, res, next) => {
    requireRoles(req, res, () => {
        if (hasSomeRole(req, ...roles)) {
            next()
        } else {
            res.status(403)
            res.send({error: `not authorized (some role in [${roles.join(", ")}] required, your roles: [${req.roles.join(", ")}])`})
        }
    }
)})

module.exports = {log, requireUser, hasSomeRole, requireRoles, requireSomeRole}