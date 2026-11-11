const assert = require('node:assert/strict')
const { before, after, test } = require('node:test')
const fs = require('node:fs/promises')
const path = require('node:path')
const express = require('express')
const gallery = require('../controllers/widgetsGallery')

// Isolated HTTP app: no server startup, configuration, credentials, or database.
const app = express()
app.use((req, res, next) => {
    const role = req.get('X-Test-Role')
    if (role) req.user = { roles: [role] }
    next()
})
app.use('/api/v0/widgets-gallery', gallery)

let server
let baseURL
before(async () => {
    server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', error => error ? reject(error) : resolve(listener))
    })
    baseURL = `http://127.0.0.1:${server.address().port}/api/v0/widgets-gallery`
})
after(() => server?.listening && new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())))

test('gallery HTML and assets require an admin session', async () => {
    for (const file of ['index.html', 'dmwidgets.js', 'gallery/config.js', 'gallery/styles.css']) {
        for (const [role, status] of [[null, 401], ['supervisor', 403]]) {
            const response = await fetch(`${baseURL}/${file}`, {
                headers: role ? { 'X-Test-Role': role } : {},
            })
            assert.equal(response.status, status, `${file}: ${role || 'anonymous'}`)
            assert.match(response.headers.get('content-type'), /application\/json/)
            await response.arrayBuffer()
        }
    }
})

test('admins receive the existing gallery and bundle without changes', async () => {
    const buildDir = path.resolve(__dirname, '../../widgets/public')
    for (const file of ['index.html', 'dmwidgets.js', 'gallery/index.js', 'gallery/config.js', 'gallery/styles.css', 'static/NoImage.png']) {
        const response = await fetch(`${baseURL}/${file}`, { headers: { 'X-Test-Role': 'admin' } })
        assert.equal(response.status, 200, file)
        assert.equal(response.headers.get('cache-control'), 'private, no-store')
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), await fs.readFile(path.join(buildDir, file)), file)
    }
})

test('missing gallery assets return 404 instead of the main app HTML', async () => {
    const response = await fetch(`${baseURL}/missing.js`, { headers: { 'X-Test-Role': 'admin' } })
    assert.equal(response.status, 404)
    assert.match((await response.json()).error, /npm --prefix widgets run build/)
})
