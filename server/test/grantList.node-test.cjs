const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')

// All database and HTTP calls are mocked; do not load credentials or start a server.
const configPath = require.resolve('../config')
require.cache[configPath] = {
    id: configPath, filename: configPath, loaded: true,
    exports: { BASE_URL: 'http://localhost:3000', API_PATH: '/api/v0' },
}
const Grant = require('../models/Grant')
const grantsQuery = require('../controllers/public/grants')
const widgetRequire = createRequire(path.resolve(__dirname, '../../widgets/package.json'))
const { transformSync } = widgetRequire('esbuild')
const React = widgetRequire('react')
const { renderToStaticMarkup } = widgetRequire('react-dom/server')
let queryResult
let fetchData
let requestedUrl
const document = { documentElement: { lang: 'it-IT' } }
const loaded = new Map()

function loadWidget(file) {
    if (loaded.has(file)) return loaded.get(file)
    const module = { exports: {} }
    const code = transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs' }).code
    vm.runInNewContext(code, {
        module, exports: module.exports, document, URLSearchParams, dmwidgets: { localDevelopment: true },
        require(name) {
            if (name === 'react-query') return { useQuery(key, fn) { fetchData = fn; return queryResult } }
            if (name === 'axios') return { get: async url => { requestedUrl = url; return { data: { data: [] } } } }
            if (name.startsWith('.')) return loadWidget(path.resolve(path.dirname(file), name + '.js'))
            return widgetRequire(name)
        },
    }, { filename: file })
    loaded.set(file, module.exports)
    return module.exports
}
const { GrantList } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/GrantList.js'))
const { getShortcodeQuery } = loadWidget(path.resolve(__dirname, '../../widgets/src/shortcode-utils.js'))
const render = props => renderToStaticMarkup(React.createElement(GrantList, props))
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this }, send(body) { this.body = body; return this } })

test('shortcode mode applies current/funding filters, reverse date sorting, and public staff data', async t => {
    let pipeline
    t.mock.method(Grant, 'aggregate', async stages => { pipeline = stages; return [] })
    const query = Object.fromEntries(new URLSearchParams(getShortcodeQuery('current,funds=International', '-startDate')))
    const res = response()
    await grantsQuery({ query: { _format: 'shortcode', ...query } }, res)
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body.data, [])
    assert.ok(pipeline.some(stage => stage.$match?.$or?.some(condition => condition.startDate?.$lte instanceof Date)))
    assert.ok(pipeline.some(stage => stage.$match?.$or?.some(condition => condition.endDate?.$gte instanceof Date)))
    assert.ok(pipeline.some(stage => stage.$match?.funds === 'International'))
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { startDate: -1 })
    const projection = pipeline.find(stage => stage.$project).$project
    assert.equal(projection.SSD, 1)
    assert.equal(projection.funds, 1)
    assert.equal(projection.notes, undefined)
    for (const field of ['pi', 'localCoordinator']) {
        assert.equal(projection[field].staffs, `$${field}.staff`)
        const lookup = pipeline.find(stage => stage.$lookup?.as === `${field}.staff`).$lookup
        assert.deepEqual(lookup.pipeline.at(-1).$project, { _id: 0, isInternal: 1 })
        assert.ok(pipeline.find(stage => stage.$set).$set[field].$cond)
    }
})

test('shortcode defaults sort by start date and private filters are rejected without querying', async t => {
    let pipeline
    const aggregate = t.mock.method(Grant, 'aggregate', async stages => { pipeline = stages; return [] })
    await grantsQuery({ query: { _format: 'shortcode' } }, response())
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { startDate: 1 })
    const res = response()
    await grantsQuery({ query: { _format: 'shortcode', notes: 'private' } }, res)
    assert.equal(res.statusCode, 400)
    assert.equal(aggregate.mock.calls.length, 1)
})

test('existing grant queries retain date range/SSD filters and response shape', async t => {
    let pipeline
    const data = [{ name: 'Mock grant' }]
    t.mock.method(Grant, 'aggregate', async stages => { pipeline = stages; return data })
    const result = await grantsQuery({ query: { from: '2025-01-01', to: '2025-12-31', ssd: 'MATH-01/A', _limit: '3' } })
    assert.equal(result.data, data)
    assert.equal(pipeline[0].$match.SSD, 'MATH-01/A')
    assert.equal(pipeline[0].$match.endDate.$gte.toISOString(), '2025-01-01T00:00:00.000Z')
    assert.equal(pipeline[0].$match.startDate.$lte.toISOString(), '2025-12-31T00:00:00.000Z')
    assert.ok(pipeline.some(stage => stage.$limit === 3))
    assert.ok(!pipeline.some(stage => stage.$facet))
    assert.equal(pipeline.at(-1).$project.pi.staffs, undefined)
})

const grant = () => ({
    _id: 'grant', name: 'Example project', projectType: 'PRIN', SSD: ['MATH-01/A', 'MATH-02/B'], funds: 'National',
    startDate: '2025-01-15', endDate: '2026-12-20',
    pi: { _id: 'internal', firstName: 'Internal', lastName: 'Person', staffs: [{ isInternal: true }] },
    localCoordinator: { _id: 'external', firstName: 'External', lastName: 'Person', staffs: [{ isInternal: false }, { isInternal: true }] },
})

test('list preserves classes, project/person links, labels, external emphasis and Italian dates', () => {
    document.documentElement.lang = 'it-IT'
    queryResult = { data: [grant()] }
    const html = render({})
    for (const text of ['<ul>', 'class="mb-2 currentmath-01/a, math-02/b National"', '/research/grant-details/?grant_id=grant', 'Example project', '(PRIN)', 'Principal Investigator', '/en/scheda-personale/?person_id=internal', 'Coordinator of the Research Unit', '<em>External Person</em>', 'Project period', '15.01.2025', '20.12.2026']) assert.ok(html.includes(text), text)
    assert.ok(!html.includes('person_id=external'))
})

test('same-person coordinator is omitted and a coordinator without a PI is supported', () => {
    const row = grant()
    row.localCoordinator = row.pi
    queryResult = { data: [row] }
    assert.ok(!render({}).includes('Coordinator of the Research Unit'))
    row.pi = null
    row.projectType = ''
    row.localCoordinator.staffs = []
    const html = render({})
    assert.ok(!html.includes('Principal Investigator') && !html.includes('<small'))
    assert.ok(html.includes('Coordinator of the Research Unit') && html.includes('<em>Internal Person</em>'))
})

test('English overrides custom date format; API request includes legacy filters and requested sort', async () => {
    queryResult = { data: [grant()] }
    document.documentElement.lang = 'it-IT'
    assert.ok(render({ date_format: 'Y-m-d' }).includes('2025-01-15'))
    document.documentElement.lang = 'en-US'
    const html = render({ date_format: 'Y-m-d', sort_field: '-startDate', filter: 'year=2025' })
    assert.ok(html.includes('Jan 15, 2025') && !html.includes('2025-01-15'))
    await fetchData()
    assert.ok(requestedUrl.startsWith('/api/v0/public/grants?_format=shortcode&'))
    assert.ok(requestedUrl.includes('_sort=-startDate') && requestedUrl.includes('endDate__gte_or_null=2025-01-01'))
})

test('empty messages, loading and errors use widget conventions', () => {
    queryResult = { data: [] }
    document.documentElement.lang = 'it-IT'
    assert.equal(render({}), '<p>nessuna informazione</p>')
    assert.equal(render({ no_data_message: 'Nessun progetto' }), '<p>Nessun progetto</p>')
    document.documentElement.lang = 'en-US'
    assert.equal(render({}), '<p>there is no data</p>')
    assert.equal(render({ no_data_message_en: 'No grants' }), '<p>No grants</p>')
    queryResult = { isLoading: true }
    assert.ok(render({}).includes('Caricamento'))
    queryResult = { error: new Error('Mock error') }
    assert.ok(render({}).includes('Mock error'))
})
