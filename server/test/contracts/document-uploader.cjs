// tools/upload-documents.js: imports documents (e.g. minutes) with their PDF
// attachments, then prints links to /process/document/<id> for the website.
// The frontend page behind those links reads /document/:id/details.

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { expectPaths } = require('../support/contractAssertions.cjs')
const { isoDay } = require('../support/contractFixtures.cjs')

const ROLES = ['document-manager']
const PDF = Buffer.from('%PDF-1.4\n% contract test\n%%EOF\n')

const contracts = [
    {
        name: 'look up an existing document by name and date',
        roles: ROLES,
        path: fx => `/api/v0/document?name=${encodeURIComponent(fx.documents.public.name)}&date=${isoDay(-40)}`,
        check(body, fx) {
            assert.equal(body.total, 1)
            assert.equal(String(body.data[0]._id), String(fx.documents.public._id))
        },
    },
    {
        name: 'upload a private PDF attachment, then create the document',
        roles: ROLES,
        async run(api) {
            const upload = await api.request('POST', '/api/v0/upload', {
                roles: ROLES,
                body: { data: PDF.toString('base64'), filename: 'verbale.pdf', mimetype: 'application/pdf', private: true },
            })
            assert.equal(upload.status, 200, upload.text)
            expectPaths(upload.body, ['upload._id', 'url'])
            assert.deepEqual(fs.readFileSync(path.join(api.uploadDirectory, String(upload.body.upload._id))), PDF)

            const created = await api.request('PUT', '/api/v0/document', {
                roles: ROLES,
                body: {
                    name: 'Verbale importato', date: new Date(isoDay(-5)).toISOString(), description: '',
                    owners: [], access_codes: ['pubblico'], attachments: [upload.body.upload._id],
                },
            })
            assert.equal(created.status, 200, created.text)
            assert.ok(created.body._id, 'the new document id is used to build the website link')

            const details = await api.request('GET', `/api/v0/document/${created.body._id}/details`)
            assert.equal(details.status, 200, details.text)
            assert.equal(details.body.allowed, true)
            assert.equal(details.body.document.attachments.length, 1)
        },
    },
    {
        name: 'website link: public document details for anonymous visitors',
        roles: null,
        path: fx => `/api/v0/document/${fx.documents.public._id}/details`,
        check(body, fx) {
            assert.equal(body.allowed, true)
            assert.equal(body.document.name, fx.documents.public.name)
        },
    },
    {
        name: 'website link: restricted document details are not allowed for anonymous visitors',
        roles: null,
        path: fx => `/api/v0/document/${fx.documents.restricted._id}/details`,
        check: body => assert.equal(body.allowed, false),
    },
]

module.exports = { contracts }
