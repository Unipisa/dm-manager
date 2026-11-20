// Contract tests for the external clients of the API (department website,
// widgets, mailing-list sync, maps, monitors, tools).
//
// Each file in test/contracts/ describes the requests one client makes, with
// the exact URLs it builds and the minimal token roles it needs, and checks
// the response fields the client reads. Endpoints and fields listed there
// must keep working when the server is refactored.
//
// The real application runs against an in-memory MongoDB seeded by
// test/support/contractFixtures.cjs.

const assert = require('node:assert/strict')
const { describe, test, before, after, mock } = require('node:test')
const { startContractServer } = require('./support/contractServer.cjs')
const { seedFixtures } = require('./support/contractFixtures.cjs')

const CLIENTS = [
    'widgets',
    'dm-calendar',
    'dm-monitor',
    'dm-planimetrie',
    'wordpress',
    'listsync',
    'document-uploader',
]

// A role no endpoint grants, used to check that authorization is enforced.
const UNRELATED_ROLES = ['contract-unrelated-role']
const BROWSER_ORIGIN = 'https://www.dm.unipi.it'

let api
let fx

before(async () => {
    // Authorization failures and upstream errors are logged by the server.
    mock.method(console, 'log', () => {})
    mock.method(console, 'error', () => {})
    api = await startContractServer()
    fx = await seedFixtures()
}, { timeout: 120_000 })

after(async () => {
    await api?.close()
    mock.restoreAll()
})

function send(contract, roles) {
    return api.request(contract.method ?? 'GET', contract.path(fx), {
        roles,
        body: contract.body?.(fx),
        headers: contract.browser ? { Origin: BROWSER_ORIGIN } : {},
    })
}

for (const client of CLIENTS) {
    const { contracts } = require(`./contracts/${client}.cjs`)

    describe(client, () => {
        for (const contract of contracts) {
            // todo: a known incompatibility, reported but not failing the suite.
            test(contract.name, { todo: contract.todo }, async () => {
                if (contract.run) return contract.run(api, fx)

                const res = await send(contract, contract.roles)
                assert.equal(res.status, contract.status ?? 200, `${contract.path(fx)} -> ${res.status} ${res.text.slice(0, 300)}`)
                if (contract.browser) {
                    assert.ok(res.headers.get('access-control-allow-origin'), 'CORS header missing for a browser client')
                }
                await contract.check?.(res.body, fx, res)
            })

            if (contract.roles && !contract.run && contract.checkDenied !== false) {
                test(`${contract.name} [denied without its roles]`, async () => {
                    for (const roles of [null, UNRELATED_ROLES]) {
                        const res = await send(contract, roles)
                        assert.ok([401, 403].includes(res.status),
                            `${contract.path(fx)} with roles ${JSON.stringify(roles)} -> ${res.status}, expected 401/403`)
                    }
                })
            }
        }
    })
}
