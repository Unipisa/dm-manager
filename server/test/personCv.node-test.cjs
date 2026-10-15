const assert = require('node:assert/strict')
const { test } = require('node:test')

// Supply a test configuration without loading local credentials or connecting to MongoDB.
const configPath = require.resolve('../config')
require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: { BASE_URL: 'http://localhost:3000', API_PATH: '/api/v0' },
}

const Person = require('../models/Person')
const Upload = require('../models/Upload')
const UploadController = require('../controllers/UploadController')
const fs = require('node:fs/promises')
const id = '0123456789abcdef01234567'
const cvUrl = `http://localhost:3000/api/v0/upload/${id}`

test('CV exposes the existing attachment widget, PDF restriction and profile editing', () => {
    const field = Person._schema_info.properties.cv
    assert.equal(field.widget, 'attachment')
    assert.equal(field.accept, 'application/pdf')
    assert.ok(Person._profile_editable_fields.includes('cv'))
})

test('upload rejects a forged PDF before creating records or writing files', async t => {
    const create = t.mock.method(Upload, 'create', async () => assert.fail('Unexpected database write'))
    const write = t.mock.method(fs, 'writeFile', async () => assert.fail('Unexpected file write'))
    const res = {
        status(code) { this.statusCode = code; return this },
        send(body) { this.body = body; return this },
    }
    await new UploadController().postFile({ body: {
        filename: 'cv.pdf', mimetype: 'application/pdf',
        data: Buffer.from('This is not a PDF').toString('base64'),
    } }, res)
    assert.equal(res.statusCode, 400)
    assert.equal(res.body.error, 'Invalid PDF file')
    assert.equal(create.mock.calls.length, 0)
    assert.equal(write.mock.calls.length, 0)
})

test('upload preserves the existing PDF and image upload flow', async t => {
    t.mock.method(Upload, 'create', async data => ({ _id: id, ...data }))
    const write = t.mock.method(fs, 'writeFile', async () => {})
    for (const [filename, mimetype, content] of [
        ['cv.pdf', 'application/pdf', '%PDF-1.7\n'],
        ['photo.png', 'image/png', 'image data'],
    ]) {
        const res = {
            status() { assert.fail('Unexpected upload error') },
            send(body) { this.body = body },
        }
        await new UploadController().postFile({ body: {
            filename, mimetype, data: Buffer.from(content).toString('base64'),
        } }, res)
        assert.equal(res.body.url, cvUrl)
        assert.equal(res.body.upload.mimetype, mimetype)
    }
    assert.equal(write.mock.calls.length, 2)
})
