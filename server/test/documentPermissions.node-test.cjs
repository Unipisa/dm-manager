const assert = require('node:assert/strict')
const { test } = require('node:test')

// Do not load local credentials or connect to MongoDB.
const configPath = require.resolve('../config')
require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: {},
}

const mongoose = require('mongoose')
mongoose.set('bufferCommands', false)
const { ObjectId } = mongoose.Types
const Document = require('../models/Document')
const Upload = require('../models/Upload')
const Group = require('../models/Group')
const DocumentController = require('../controllers/DocumentController')
const UploadController = require('../controllers/UploadController')
const controller = new DocumentController()
const personId = new ObjectId()
const userId = new ObjectId()
const document = {
    _id: new ObjectId(),
    access_codes: ['utente-con-credenziali-manage'],
    owners: [{ _id: personId }],
}

function response() {
    return {
        statusCode: 200,
        status(code) { this.statusCode = code; return this },
        send(body) { this.body = body; return this },
    }
}

test('anonymous users can read public documents with owners', async () => {
    assert.equal(await controller.checkPermission({}, {
        ...document, access_codes: ['pubblico'],
    }), true)
})

test('anonymous document details return allowed=false instead of throwing', async t => {
    t.mock.method(Document, 'aggregate', async () => [document])
    const res = response()
    await controller.getDocument({}, res, document._id.toString())
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.allowed, false)
    assert.equal(res.body.document, document)
})

test('anonymous access is denied for restricted documents with or without owners', async () => {
    for (const access_codes of [[], ['utente-con-credenziali-manage'], ['consiglio-dipartimento']]) {
        for (const owners of [[], [personId], [{ _id: personId }]]) {
            assert.equal(await controller.checkPermission({}, { ...document, access_codes, owners }), false)
        }
    }
})

test('owner access uses the associated Person for raw and populated references', async () => {
    for (const person of [personId, { _id: personId }]) {
        for (const owners of [[personId], [{ _id: personId }]]) {
            assert.equal(await controller.checkPermission({ user: { _id: userId, person } }, {
                ...document, access_codes: [], owners,
            }), true)
        }
    }
    assert.equal(await controller.checkPermission({ user: { _id: personId } }, {
        ...document, access_codes: [],
    }), false)
})

test('admin, credential and group permissions continue to apply', async t => {
    assert.equal(await controller.checkPermission({ roles: ['admin'] }, document), true)
    assert.equal(await controller.checkPermission({ user: { _id: userId, person: new ObjectId() } }, document), true)
    assert.equal(await controller.checkPermission({ user: { _id: userId } }, document), false)

    const aggregate = t.mock.method(Group, 'aggregate', async () => [{ _id: new ObjectId() }])
    const req = { user: { _id: userId, person: new ObjectId() } }
    const restricted = { ...document, access_codes: ['consiglio-dipartimento'] }
    assert.equal(await controller.checkPermission(req, restricted), true)
    aggregate.mock.mockImplementation(async () => [])
    assert.equal(await controller.checkPermission(req, restricted), false)
})

test('private attachment requests return 403 for anonymous users', async t => {
    const upload = { _id: new ObjectId(), private: true }
    t.mock.method(Upload, 'findById', async () => upload)
    t.mock.method(Document, 'find', async () => [document])
    const res = response()
    await new UploadController().getFile({}, res, upload._id.toString())
    assert.equal(res.statusCode, 403)
})

test('upload routes do not expose the server configuration', () => {
    const routes = []
    new UploadController().register({
        get(path) { routes.push(['GET', path]) },
        post(path) { routes.push(['POST', path]) },
    })
    assert.deepEqual(routes, [['GET', '/upload/:id'], ['POST', '/upload']])
})
