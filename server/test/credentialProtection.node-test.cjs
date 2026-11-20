// Password hashes are never returned by the API, and tokens can only be
// created with roles the creator holds. Runs the real application against an
// in-memory MongoDB (see test/support/contractServer.cjs).

const assert = require('node:assert/strict')
const { describe, test, before, after, mock } = require('node:test')
const { startContractServer } = require('./support/contractServer.cjs')

let api
let target

before(async () => {
    mock.method(console, 'log', () => {})
    mock.method(console, 'error', () => {})
    api = await startContractServer()
    // A user with a local password: hash and salt are stored in MongoDB.
    await api.loginAs('target-admin', ['admin'])
    const User = require('../models/User')
    target = await User.findOne({ username: 'target-admin' }).select('+hash +salt')
    assert.ok(target.hash && target.salt, 'fixture user must have a local password')
}, { timeout: 120_000 })

after(async () => {
    await api?.close()
    mock.restoreAll()
})

function assertNoPasswordFields(users) {
    assert.ok(users.length > 0)
    for (const user of users) {
        assert.equal(user.hash, undefined, `hash returned for ${user.username}`)
        assert.equal(user.salt, undefined, `salt returned for ${user.username}`)
    }
}

describe('user password hashes', () => {
    for (const roles of [['supervisor'], ['admin']]) {
        test(`are not returned to ${roles} by index, full index, search and get`, async () => {
            const index = await api.request('GET', '/api/v0/user', { roles })
            assert.equal(index.status, 200, index.text)
            assertNoPasswordFields(index.body.data)

            const full = await api.request('GET', '/api/v0/user?_full=1', { roles })
            assert.equal(full.status, 200, full.text)
            assertNoPasswordFields(full.body.data)

            const search = await api.request('GET', '/api/v0/user/search/?_search=target', { roles })
            assert.equal(search.status, 200, search.text)
            assertNoPasswordFields(search.body.data)

            const one = await api.request('GET', `/api/v0/user/${target._id}`, { roles })
            assert.equal(one.status, 200, one.text)
            assertNoPasswordFields([one.body])
        })
    }

    test('cannot be used as filters or sort keys', async () => {
        for (const query of [`hash=${target.hash}`, `salt__regex=^${target.salt.slice(0, 2)}`, '_sort=hash']) {
            const res = await api.request('GET', `/api/v0/user?${query}`, { roles: ['supervisor'] })
            assert.equal(res.status, 400, `${query} -> ${res.status}`)
        }
    })

    test('are not returned by the password login response', async () => {
        const res = await fetch(`${api.baseUrl}/login/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'target-admin', password: 'target-admin-password' }),
        })
        const body = await res.json()
        assert.equal(res.status, 200)
        assertNoPasswordFields([body.user])
    })
})

describe('token creation', () => {
    const Token = () => require('../models/Token')

    test('is refused, and nothing is stored, for roles the user does not hold', async () => {
        const cookie = await api.loginAs('plain-user', ['room-manager'])
        for (const roles of [['admin'], ['room-manager', 'admin'], ['supervisor']]) {
            const name = `escalation ${roles.join(' ')}`
            const res = await api.request('PUT', '/api/v0/token', { cookie, body: { name, roles } })
            assert.equal(res.status, 403, `${JSON.stringify(roles)} -> ${res.status} ${res.text}`)
            assert.equal(await Token().countDocuments({ name }), 0, `token with roles ${roles} was stored`)
        }
    })

    test('is allowed for roles the user holds, with a server-generated secret', async () => {
        const cookie = await api.loginAs('room-user', ['room-manager'])
        const res = await api.request('PUT', '/api/v0/token', {
            cookie, body: { name: 'room tool', roles: ['room-manager'], token: 'chosen-secret', createdBy: null },
        })
        assert.equal(res.status, 200, res.text)
        const stored = await Token().findOne({ name: 'room tool' })
        assert.deepEqual([...stored.roles], ['room-manager'])
        assert.notEqual(stored.token, 'chosen-secret')
        assert.ok(stored.createdBy, 'creator is recorded')
    })

    test('admins can create tokens with any role', async () => {
        const cookie = await api.loginAs('token-admin', ['admin'])
        const res = await api.request('PUT', '/api/v0/token', { cookie, body: { name: 'sync', roles: ['staff-supervisor'] } })
        assert.equal(res.status, 200, res.text)
    })

    test('rejects malformed roles', async () => {
        const cookie = await api.loginAs('malformed-user', ['room-manager'])
        for (const roles of ['admin', [1], { 0: 'admin' }]) {
            const res = await api.request('PUT', '/api/v0/token', { cookie, body: { name: 'malformed', roles } })
            assert.equal(res.status, 400, `${JSON.stringify(roles)} -> ${res.status}`)
        }
        assert.equal(await Token().countDocuments({ name: 'malformed' }), 0)
    })

    test('requires a logged-in user, not a bearer token', async () => {
        const res = await api.request('PUT', '/api/v0/token', { roles: ['admin'], body: { name: 'via token', roles: [] } })
        assert.equal(res.status, 401)
    })
})
