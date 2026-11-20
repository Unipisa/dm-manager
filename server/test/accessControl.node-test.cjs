// Password hashes are never returned by the API, tokens can only be
// created with roles the creator holds, and files can only be uploaded by
// logged-in users or document tokens. Runs the real application against an
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

describe('file upload', () => {
    const Upload = () => require('../models/Upload')
    const fs = require('node:fs')
    const pdf = { data: Buffer.from('%PDF-1.4\n%%EOF\n').toString('base64'), mimetype: 'application/pdf' }

    async function attempt(options, filename) {
        const before = fs.readdirSync(api.uploadDirectory).length
        const res = await api.request('POST', '/api/v0/upload', { ...options, body: { ...pdf, filename } })
        const stored = await Upload().countDocuments({ filename })
        const written = fs.readdirSync(api.uploadDirectory).length - before
        return { res, stored, written }
    }

    test('is refused to anonymous clients, storing nothing', async () => {
        const { res, stored, written } = await attempt({}, 'anonymous.pdf')
        assert.equal(res.status, 401, res.text)
        assert.equal(stored, 0)
        assert.equal(written, 0)
    })

    test('is refused to tokens without a document role', async () => {
        for (const roles of [['room-manager'], ['/process/planimetrie']]) {
            const { res, stored, written } = await attempt({ roles }, `token-${roles[0]}.pdf`)
            assert.equal(res.status, 403, `${roles} -> ${res.status}`)
            assert.equal(stored, 0)
            assert.equal(written, 0)
        }
    })

    test('is allowed to any logged-in user and to document tokens', async () => {
        const cookie = await api.loginAs('form-user', [])
        for (const [options, filename] of [[{ cookie }, 'form.pdf'], [{ roles: ['document-manager'] }, 'tool.pdf'], [{ roles: ['admin'] }, 'admin.pdf']]) {
            const { res, stored, written } = await attempt(options, filename)
            assert.equal(res.status, 200, `${filename} -> ${res.status} ${res.text}`)
            assert.equal(stored, 1)
            assert.equal(written, 1)
        }
    })
})

describe('token listing and deletion', () => {
    const Token = () => require('../models/Token')

    async function createToken(cookie, name, roles) {
        const res = await api.request('PUT', '/api/v0/token', { cookie, body: { name, roles } })
        assert.equal(res.status, 200, res.text)
        return Token().findOne({ name })
    }

    test('users see the secrets of their own tokens only', async () => {
        const owner = await api.loginAs('list-owner', ['room-manager'])
        const supervisor = await api.loginAs('list-supervisor', ['supervisor', 'room-manager'])
        const mine = await createToken(owner, 'owner token', ['room-manager'])
        const theirs = await createToken(supervisor, 'supervisor token', ['room-manager'])

        const listed = await api.request('GET', '/api/v0/token', { cookie: owner })
        assert.equal(listed.status, 200, listed.text)
        assert.deepEqual(listed.body.data.map(token => token.name), ['owner token'])
        assert.equal(listed.body.data[0].token, mine.token)

        // supervisors list every token, but only their own secrets
        const all = await api.request('GET', '/api/v0/token', { cookie: supervisor })
        const byName = Object.fromEntries(all.body.data.map(token => [token.name, token.token]))
        assert.equal(byName['supervisor token'], theirs.token)
        assert.equal(byName['owner token'], '*HIDDEN*')
    })

    test('users can delete their own tokens, not the tokens of others', async () => {
        const owner = await api.loginAs('delete-owner', ['room-manager'])
        const other = await api.loginAs('delete-other', ['room-manager'])
        const token = await createToken(owner, 'to delete', ['room-manager'])

        const refused = await api.request('DELETE', `/api/v0/token/${token._id}`, { cookie: other })
        assert.equal(refused.status, 404, refused.text)
        assert.ok(await Token().findById(token._id), 'token deleted by another user')

        const deleted = await api.request('DELETE', `/api/v0/token/${token._id}`, { cookie: owner })
        assert.equal(deleted.status, 200, deleted.text)
        assert.equal(await Token().findById(token._id), null)
    })

    test('admins see every secret and can delete any token', async () => {
        const owner = await api.loginAs('admin-target', ['room-manager'])
        const admin = await api.loginAs('token-admin-2', ['admin'])
        const token = await createToken(owner, 'admin visible', ['room-manager'])

        const all = await api.request('GET', '/api/v0/token', { cookie: admin })
        assert.equal(all.body.data.find(t => t.name === 'admin visible').token, token.token)

        const deleted = await api.request('DELETE', `/api/v0/token/${token._id}`, { cookie: admin })
        assert.equal(deleted.status, 200, deleted.text)
    })
})
