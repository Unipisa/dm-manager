// Boots the real Express application (createApp) against an in-memory
// MongoDB, so client contracts are checked through the same middleware,
// routing, authorization and aggregation pipelines used in production.
//
// The MongoDB version is pinned in server/package.json
// ("config.mongodbMemoryServer.version") to match docker-compose.yml.

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
const { MongoMemoryServer } = require('mongodb-memory-server')

const UNIPI_TOKENS = {
    UNIPI_TOKEN: 'test-unipi-token',
    UNIPI_TOKENARPI: 'test-arpi-token',
    UNIPI_TOKENARPILINK: 'test-arpi-link-token',
}

// Stand-in for the University APIs queried by /public/unimap/:matricola.
function startUnipiApiStub() {
    const server = http.createServer((req, res) => {
        const send = body => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(body))
        }
        if (req.url.startsWith('/registri/1.0/elenco/')) {
            return send({ results: { registro: [{ nomeInsegnamento: 'Analisi Matematica', anno: 2025 }] } })
        }
        if (req.url.startsWith('/uniarpi/1.0/linkRicerca/')) {
            return send({ linkToArpi: 'https://arpi.example.test/author/1' })
        }
        if (req.url.startsWith('/arpicineca/1.0/getElencoPeriodo/')) {
            return send({ entries: { entry: [{ title: 'A theorem', year: 2025 }] } })
        }
        res.writeHead(404).end()
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)))
}

function listen(app) {
    return new Promise(resolve => {
        const server = app.listen(0, '127.0.0.1', () => resolve(server))
    })
}

// Run fn with console output suppressed (startup banners and warnings).
async function quietly(fn) {
    const saved = { log: console.log, error: console.error }
    console.log = console.error = () => {}
    try {
        return await fn()
    } finally {
        Object.assign(console, saved)
    }
}

async function startContractServer() {
    const mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri('dm-manager-contracts')
    const uploadDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-manager-contracts-'))
    const unipi = await startUnipiApiStub()

    // Must happen before config.js is first required. Empty values also keep
    // a developer's .env from enabling external integrations during tests.
    Object.assign(process.env, {
        NODE_ENV: 'test',
        DOTENV_CONFIG_QUIET: 'true',
        MONGO_URI: uri,
        MONGO_TEST_URI: uri,
        UPLOAD_DIRECTORY: uploadDirectory,
        UNIPI_API_URL: `http://127.0.0.1:${unipi.address().port}/`,
        ...UNIPI_TOKENS,
        OAUTH2_CLIENT_ID: '',
        SMTP_HOST: '',
        MRBS_API_URL: '',
        MRBS_API_SECRET_TOKEN: '',
        WEB_PAGES_SERVER_UPDATE_URL: '',
        ADMIN_USER: '',
        ADMIN_PASSWORD: '',
        TOKEN_SECRET: '',
    })

    const mongoose = require('mongoose')
    const { setupDatabase } = require('../../database')
    const { createApp } = require('../../server')
    const Token = require('../../models/Token')

    const connection = await quietly(setupDatabase)
    if (!connection) throw new Error(`cannot connect to in-memory MongoDB at ${uri}`)
    const app = await quietly(createApp)
    const server = await listen(app)
    const baseUrl = `http://127.0.0.1:${server.address().port}`

    const tokens = new Map()

    // A bearer token holding exactly the given roles, created on first use.
    async function tokenFor(roles) {
        const key = JSON.stringify([...roles].sort())
        if (!tokens.has(key)) {
            const token = await Token.create({ name: `contract ${key}`, roles })
            tokens.set(key, token.token)
        }
        return tokens.get(key)
    }

    // A session cookie for a local user created with the given roles.
    async function loginAs(username, roles = []) {
        const { createOrUpdateUser } = require('../../database')
        const password = `${username}-password`
        await quietly(() => createOrUpdateUser({ username, password, roles }))
        const res = await fetch(`${baseUrl}/login/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        })
        if (res.status !== 200) throw new Error(`login of ${username} failed: ${res.status}`)
        return res.headers.get('set-cookie').split(';')[0]
    }

    // roles: array of token roles, or null for an anonymous request.
    // cookie: a session cookie from loginAs, for requests as a logged-in user.
    async function request(method, url, { roles = null, cookie, body, headers = {} } = {}) {
        const allHeaders = { Accept: 'application/json', ...headers }
        if (roles) allHeaders.Authorization = `Bearer ${await tokenFor(roles)}`
        if (cookie) allHeaders.Cookie = cookie
        if (body !== undefined) allHeaders['Content-Type'] = 'application/json'
        const res = await fetch(baseUrl + url, {
            method,
            headers: allHeaders,
            body: body === undefined ? undefined : JSON.stringify(body),
        })
        const text = await res.text()
        let json
        try { json = JSON.parse(text) } catch { json = undefined }
        return { status: res.status, headers: res.headers, body: json, text }
    }

    async function close() {
        await new Promise(resolve => server.close(resolve))
        await new Promise(resolve => unipi.close(resolve))
        await mongoose.disconnect()
        await mongod.stop()
        fs.rmSync(uploadDirectory, { recursive: true, force: true })
    }

    return { baseUrl, request, tokenFor, loginAs, uploadDirectory, close }
}

module.exports = { startContractServer }
