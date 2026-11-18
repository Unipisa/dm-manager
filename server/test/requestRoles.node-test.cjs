const assert = require('node:assert/strict')
const { test } = require('node:test')
const Person = require('../models/Person')
const Staff = require('../models/Staff')
const Token = require('../models/Token')
const requestRoles = require('../middleware/requestRoles')

// Exercise the real middleware without credentials, MongoDB or server startup.
function context(user, authorization) {
    const req = { user, headers: { authorization } }
    const res = {
        status(code) { this.statusCode = code; return this },
        send(body) { this.body = body; return this },
    }
    let nextCalls = 0
    return { req, res, next: () => { nextCalls++ }, get nextCalls() { return nextCalls } }
}

function noDatabase(t) {
    for (const [model, method] of [[Person, 'findById'], [Staff, 'aggregate'], [Token, 'findOne']]) {
        t.mock.method(model, method, async () => assert.fail(`Unexpected ${model.modelName}.${method}`))
    }
}

const commonRoles = ['/process/seminars', '/process/conferences', '/process/visitsList']
const ownVisit = '/process/my/visits'
const workRoles = ['/process/my/courses', '/process/timesheets']

test('anonymous requests have an empty context and perform no database queries', async t => {
    noDatabase(t)
    const ctx = context()
    await requestRoles(ctx.req, ctx.res, ctx.next)
    assert.equal(ctx.req.person, null)
    assert.deepEqual(ctx.req.staffs, [])
    assert.deepEqual(ctx.req.roles, [])
    assert.equal(ctx.req.log_who, undefined)
    assert.equal(ctx.nextCalls, 1)
})

test('users without a linked person retain a copy of their roles and audit identity', async t => {
    noDatabase(t)
    for (const username of ['alice', '']) {
        const user = { _id: 'user-id', username, roles: ['supervisor'] }
        const ctx = context(user, 'Basic ignored')
        await requestRoles(ctx.req, ctx.res, ctx.next)
        assert.deepEqual(ctx.req.roles, user.roles)
        assert.notEqual(ctx.req.roles, user.roles)
        assert.equal(ctx.req.log_who, username || 'user-id')
        assert.equal(ctx.nextCalls, 1)
    }
})

test('staff queries select the linked person and current assignments with inclusive open boundaries', async t => {
    const personId = new Person()._id
    const person = { _id: personId }
    t.mock.method(Person, 'findById', async id => {
        assert.equal(id, personId)
        return person
    })
    t.mock.method(Staff, 'aggregate', async pipeline => {
        assert.deepEqual(pipeline, [
            { $match: { person: personId } },
            { $match: { $expr: { $and: [
                { $or: [{ $eq: ['$startDate', null] }, { $lte: ['$startDate', '$$NOW'] }] },
                { $or: [{ $eq: ['$endDate', null] }, { $gte: ['$endDate', '$$NOW'] }] },
            ] } } },
        ])
        return []
    })
    const ctx = context({ username: 'alice', person: personId, roles: [] })
    await requestRoles(ctx.req, ctx.res, ctx.next)
    assert.equal(ctx.req.person, person)
    assert.deepEqual(ctx.req.staffs, [])
    assert.deepEqual(ctx.req.roles, [])
    assert.equal(ctx.nextCalls, 1)
})

test('every staff qualification retains its existing permissions, only for internal staff', async t => {
    const fullAccess = [
        'PO', 'PA', 'RIC', 'RTDb', 'RTDa', 'RTT', 'Assegnista', 'Tecnologo',
        'Titolare di contratto di ricerca', 'Titolare di incarico post-doc',
        'Titolare di incarico di ricerca', 'Titolare di borsa di ricerca',
        'Dottorando in Matematica', 'Dottorando in HPSC',
    ]
    const visitAccess = ['Professore Emerito', 'Collaboratore', 'Personale in quiescenza']
    t.mock.method(Person, 'findById', async () => null)
    let staffs
    t.mock.method(Staff, 'aggregate', async () => staffs)
    for (const qualification of [...Staff.schema.path('qualification').enumValues, 'unknown']) {
        for (const isInternal of [true, false]) {
            staffs = [{ qualification, isInternal }]
            const user = { username: 'alice', person: 'person-id', roles: ['custom'] }
            const ctx = context(user)
            await requestRoles(ctx.req, ctx.res, ctx.next)
            const expected = ['custom']
            if (isInternal) {
                if (fullAccess.includes(qualification)) expected.push(...commonRoles, ownVisit, ...workRoles)
                else if (visitAccess.includes(qualification)) expected.push(...commonRoles, ownVisit)
                else if (qualification === 'PTA') expected.push(...commonRoles, ...workRoles)
            }
            assert.deepEqual(ctx.req.roles, expected, `${qualification}, internal=${isInternal}`)
            assert.deepEqual(user.roles, ['custom'])
            assert.equal(ctx.req.staffs, staffs)
            assert.equal(ctx.nextCalls, 1)
        }
    }
})

test('multiple assignments do not duplicate derived or explicitly assigned roles', async t => {
    t.mock.method(Person, 'findById', async () => null)
    t.mock.method(Staff, 'aggregate', async () => [
        { qualification: 'PO', isInternal: true },
        { qualification: 'PTA', isInternal: true },
    ])
    const ctx = context({ username: 'alice', person: 'person-id', roles: [commonRoles[0]] })
    await requestRoles(ctx.req, ctx.res, ctx.next)
    assert.deepEqual(ctx.req.roles, [...commonRoles, ownVisit, ...workRoles])
})

test('Bearer roles replace session and derived permissions while preserving person context', async t => {
    const person = { _id: 'person-id' }
    const staffs = [{ qualification: 'PO', isInternal: true }]
    t.mock.method(Person, 'findById', async () => person)
    t.mock.method(Staff, 'aggregate', async () => staffs)
    t.mock.method(Token, 'findOne', async query => {
        assert.deepEqual(query, { token: 'secret' })
        return { name: 'integration', token: 'secret', roles: ['api-reader'] }
    })
    const ctx = context({ username: 'admin', person: person._id, roles: ['admin'] }, 'Bearer secret')
    await requestRoles(ctx.req, ctx.res, ctx.next)
    assert.deepEqual(ctx.req.roles, ['api-reader'])
    assert.equal(ctx.req.person, person)
    assert.equal(ctx.req.staffs, staffs)
    assert.equal(ctx.req.log_who, 'integration')
    assert.equal(ctx.nextCalls, 1)
})

test('anonymous Bearer requests support tokens without names or roles', async t => {
    t.mock.method(Token, 'findOne', async () => ({ token: 'secret' }))
    const ctx = context(undefined, 'Bearer secret')
    await requestRoles(ctx.req, ctx.res, ctx.next)
    assert.deepEqual(ctx.req.roles, [])
    assert.equal(ctx.req.log_who, 'secret')
    assert.equal(ctx.nextCalls, 1)
})

test('missing tokens and token lookup errors return 401 without continuing', async t => {
    let failLookup = false
    t.mock.method(Token, 'findOne', async () => {
        if (failLookup) throw new Error('lookup failed')
        return null
    })
    for (const shouldFail of [false, true]) {
        failLookup = shouldFail
        const ctx = context({ username: 'admin', roles: ['admin'] }, 'Bearer invalid')
        await requestRoles(ctx.req, ctx.res, ctx.next)
        assert.equal(ctx.res.statusCode, 401)
        assert.deepEqual(ctx.res.body, { error: 'invalid token' })
        assert.equal(ctx.nextCalls, 0)
    }
})

test('person and staff lookup errors propagate to Express without continuing', async t => {
    const failure = new Error('database unavailable')
    let failPerson = true
    t.mock.method(Person, 'findById', async () => {
        if (failPerson) throw failure
        return null
    })
    t.mock.method(Staff, 'aggregate', async () => { throw failure })
    for (const shouldFail of [true, false]) {
        failPerson = shouldFail
        const ctx = context({ username: 'alice', person: 'person-id', roles: [] })
        await assert.rejects(requestRoles(ctx.req, ctx.res, ctx.next), error => error === failure)
        assert.equal(ctx.nextCalls, 0)
        assert.equal(ctx.res.statusCode, undefined)
    }
})
