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

const requirePathPermissions = async (req, res, next) => {
    const fullUrl = req.baseUrl + req.path

    const hasPermission = req.roles?.includes('admin') || req.roles.reduce(
        (x,y) => x || y && fullUrl.startsWith(`/api/v0${y}`), false
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
    if (hasSomeRole(req, ...roles)) {
        next()
    } else {
        res.status(403)
        const error = `some role in [${roles.join(", ")}] required, your roles: [${req.roles.join(", ")}]`
        console.log(error)
        res.send({error})
    }
})

module.exports = {log, requireUser, hasSomeRole, allowAnonymous, requireSomeRole, requirePathPermissions}