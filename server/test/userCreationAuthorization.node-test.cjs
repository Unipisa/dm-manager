const assert = require('node:assert/strict')
const { test } = require('node:test')
const User = require('../models/User')
const Log = require('../models/Log')
const UserController = require('../controllers/UserController')
const Controller = require('../controllers/Controller')

// Exercise the registered authorization middleware and real controller methods.
// Database operations are mocked; no configuration, credentials or server startup.
function routes(controller) {
    const registered = new Map()
    const router = Object.fromEntries(['get', 'put', 'post', 'patch', 'delete']
        .map(method => [method, (path, ...handlers) => registered.set(`${method} ${path}`, handlers)]))
    controller.register(router)
    return registered
}

function response() {
    return {
        statusCode: 200,
        status(code) { this.statusCode = code; return this },
        send(body) { this.body = body; return this },
    }
}

async function dispatch(handlers, req, res) {
    const [guard, handler] = handlers
    let allowed = false
    await guard(req, res, () => { allowed = true })
    if (allowed) await handler(req, res)
}

test('anonymous and non-admin roles cannot create users or write an audit entry', async t => {
    const create = t.mock.method(User, 'create', async () => assert.fail('Unexpected user creation'))
    const log = t.mock.method(Log, 'create', async () => assert.fail('Unexpected audit write'))
    t.mock.method(console, 'log', () => {})
    const handlers = routes(new UserController()).get('put /user')
    for (const roles of [[], ['supervisor'], ['person-manager'], ['disguised-admin']]) {
        const res = response()
        await dispatch(handlers, {
            roles,
            user: roles.length ? { _id: 'caller' } : undefined,
            body: { username: 'attacker', roles: ['admin'], hash: 'hash', salt: 'salt' },
        }, res)
        assert.equal(res.statusCode, 403)
    }
    assert.equal(create.mock.callCount(), 0)
    assert.equal(log.mock.callCount(), 0)
})

test('admin can create a user with permitted fields, but cannot mass-assign other fields', async t => {
    let stored
    const create = t.mock.method(User, 'create', async payload => {
        stored = payload
        return { ...payload, _id: 'new-user' }
    })
    const log = t.mock.method(Log, 'create', async () => {})
    const controller = new UserController()
    t.mock.method(controller, 'get', async (req, res, id) => res.send({ _id: id }))
    const res = response()
    await dispatch(routes(controller).get('put /user'), {
        roles: ['admin'], user: { _id: 'admin-user' },
        body: {
            firstName: 'Example', lastName: 'User', username: 'example',
            email: 'example@example.test', person: null, roles: ['supervisor'],
            _id: 'chosen-id', attempts: 0, password: 'not-supported',
            'hash.value': 'injected', $set: { roles: ['admin'] },
            createdAt: '2000-01-01', createdBy: 'forged',
        },
    }, res)
    assert.equal(res.statusCode, 200)
    assert.equal(create.mock.callCount(), 1)
    assert.equal(log.mock.callCount(), 1)
    assert.deepEqual(stored, {
        firstName: 'Example', lastName: 'User', username: 'example',
        email: 'example@example.test', person: null, roles: ['supervisor'],
        createdBy: 'admin-user', updatedBy: 'admin-user',
    })
    assert.deepEqual(res.body, { _id: 'new-user' })
})

test('generic user writes reject hash and salt before any database or audit operation', async t => {
    t.mock.method(User, 'create', async () => assert.fail('Unexpected user creation'))
    t.mock.method(User, 'findById', async () => assert.fail('Unexpected database read'))
    t.mock.method(Log, 'create', async () => assert.fail('Unexpected audit write'))
    const controller = new UserController()
    for (const field of ['hash', 'salt']) {
        for (const value of ['injected', '', null]) {
            for (const method of ['put', 'patch']) {
                const res = response()
                await controller[method]({
                    user: { _id: 'admin' }, body: { username: 'example', [field]: value },
                }, res, 'user-id')
                assert.equal(res.statusCode, 400)
                assert.match(res.body.error, /password endpoint/)
            }
        }
    }
})

test('user writes reject malformed payloads without touching the database', async t => {
    t.mock.method(User, 'create', async () => assert.fail('Unexpected user creation'))
    t.mock.method(User, 'findById', async () => assert.fail('Unexpected database read'))
    const controller = new UserController()
    for (const body of [undefined, null, [], 'user', 42]) {
        for (const method of ['put', 'patch']) {
            const res = response()
            await controller[method]({ body }, res, 'user-id')
            assert.equal(res.statusCode, 400)
        }
    }
})

test('editing permitted user fields preserves stored credentials', async t => {
    const user = new User({ username: 'example', hash: 'existing-hash', salt: 'existing-salt' })
    const caller = new User({ username: 'admin' })
    t.mock.method(User, 'findById', async () => user)
    const save = t.mock.method(user, 'save', async () => user)
    t.mock.method(Log, 'create', async () => {})
    const res = response()
    await new UserController().patch({
        user: caller,
        body: { firstName: 'Changed', roles: ['supervisor'], attempts: 99, 'hash.value': 'injected' },
    }, res, user._id)
    assert.equal(res.statusCode, 200)
    assert.equal(save.mock.callCount(), 1)
    assert.equal(user.firstName, 'Changed')
    assert.deepEqual([...user.roles], ['supervisor'])
    assert.equal(user.hash, 'existing-hash')
    assert.equal(user.salt, 'existing-salt')
})

test('supervisor retains read access but cannot edit users or set passwords', async t => {
    t.mock.method(console, 'log', () => {})
    const registered = routes(new UserController())
    for (const route of ['get /user', 'get /user/search/', 'get /user/:id']) {
        let allowed = false
        registered.get(route)[0]({ roles: ['supervisor'] }, response(), () => { allowed = true })
        assert.equal(allowed, true, route)
    }
    for (const route of ['patch /user/:id', 'post /user/:id/setLocalPassword']) {
        const res = response()
        registered.get(route)[0]({ roles: ['supervisor'] }, res, () => assert.fail(route))
        assert.equal(res.statusCode, 403)
    }
})

test('the dedicated password endpoint still uses setPassword for admins', async t => {
    const user = { hash: 'existing', setPassword: async () => {}, save: async () => {} }
    t.mock.method(User, 'findById', async () => user)
    const setPassword = t.mock.method(user, 'setPassword')
    const save = t.mock.method(user, 'save')
    const res = response()
    await dispatch(routes(new UserController()).get('post /user/:id/setLocalPassword'), {
        roles: ['admin'], params: { id: 'user-id' }, body: { newPassword: 'test-password-only' },
    }, res)
    assert.equal(res.statusCode, 200)
    assert.equal(setPassword.mock.calls[0].arguments[0], 'test-password-only')
    assert.equal(save.mock.callCount(), 1)
})

test('other models retain their existing creation permissions', () => {
    const controller = new Controller(User)
    controller.path = 'example'
    let allowed = false
    routes(controller).get('put /example')[0]({ roles: ['supervisor'] }, response(), () => { allowed = true })
    assert.equal(allowed, true)
})
