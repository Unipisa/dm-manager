const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')

// All aggregates and HTTP calls are mocked; never load credentials or connect to MongoDB.
const configPath = require.resolve('../config')
require.cache[configPath] = {
    id: configPath, filename: configPath, loaded: true,
    exports: { BASE_URL: 'http://localhost:3000', API_PATH: '/api/v0' },
}
const Thesis = require('../models/Thesis')
const thesesQuery = require('../controllers/public/theses')
const widgetRequire = createRequire(path.resolve(__dirname, '../../widgets/package.json'))
const { transformSync } = widgetRequire('esbuild')
const React = widgetRequire('react')
const { renderToStaticMarkup } = widgetRequire('react-dom/server')
let queryResult
let fetchData
let requestedUrl
const document = { documentElement: { lang: 'it-IT' }, cookie: '' }
const loaded = new Map()

function loadWidget(file) {
    if (loaded.has(file)) return loaded.get(file)
    const module = { exports: {} }
    const code = transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs' }).code
    vm.runInNewContext(code, {
        module, exports: module.exports, document, URLSearchParams, dmwidgets: { localDevelopment: true },
        require(name) {
            if (name.endsWith('.css')) return {}
            if (name === 'react-query') return { useQuery(key, fn) { fetchData = fn; return queryResult } }
            if (name === 'axios') return { get: async url => { requestedUrl = url; return { data: { data: [] } } } }
            if (name.startsWith('.')) return loadWidget(path.resolve(path.dirname(file), name + '.js'))
            return widgetRequire(name)
        },
    }, { filename: file })
    loaded.set(file, module.exports)
    return module.exports
}
const { ThesisList } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/ThesisList.js'))
const { getShortcodeQuery } = loadWidget(path.resolve(__dirname, '../../widgets/src/shortcode-utils.js'))
const render = props => renderToStaticMarkup(React.createElement(ThesisList, props))
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this }, send(body) { this.body = body; return this } })

test('shortcode mode supports legacy date filters, surname sorting, and public thesis fields', async t => {
    let pipeline
    t.mock.method(Thesis, 'aggregate', async stages => { pipeline = stages; return [] })
    const query = Object.fromEntries(new URLSearchParams(getShortcodeQuery('dateyear=2025', '-person')))
    const res = response()
    await thesesQuery({ query: { _format: 'shortcode', ...query } }, res)
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body.data, [])
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { 'person.lastName': -1, 'person.firstName': -1 })
    assert.ok(pipeline.some(stage => stage.$match?.date?.$lte instanceof Date))
    assert.ok(pipeline.some(stage => stage.$match?.date?.$gte instanceof Date))
    const projection = pipeline.find(stage => stage.$project).$project
    assert.equal(projection.person.genealogyId, 1)
    assert.equal(projection.person.email, 1)
    assert.equal(projection.person.phone, 1)
    assert.equal(projection.notes, undefined)
    const advisors = pipeline.find(stage => stage.$lookup?.as === 'advisors').$lookup.pipeline
    assert.equal(advisors.find(stage => stage.$project).$project.staffs, '$staff')
    const staffProjection = advisors.find(stage => stage.$lookup?.as === 'staff').$lookup.pipeline.at(-1).$project
    assert.deepEqual(staffProjection, { _id: 0, qualification: 1, isInternal: 1 })
})

test('existing theses query preserves year/SSD filters and original response shape', async t => {
    let pipeline
    const data = [{ title: 'Mock thesis' }]
    t.mock.method(Thesis, 'aggregate', async stages => { pipeline = stages; return data })
    const result = await thesesQuery({ query: { year: '2025', ssd: 'MATH-01/A', _sort: 'date', _limit: '3' } })
    assert.equal(result.data, data)
    assert.equal(pipeline[0].$match.SSD, 'MATH-01/A')
    assert.equal(pipeline[0].$match.date.$gte.toISOString(), '2025-01-01T00:00:00.000Z')
    assert.ok(pipeline.some(stage => stage.$limit === 3))
    assert.ok(!pipeline.some(stage => stage.$facet))
    assert.equal(pipeline.at(-1).$project.person.genealogyId, undefined)
})

test('private-field filters are rejected without a database call', async t => {
    const aggregate = t.mock.method(Thesis, 'aggregate', async () => [])
    const res = response()
    await thesesQuery({ query: { _format: 'shortcode', notes: 'private' } }, res)
    assert.equal(res.statusCode, 400)
    assert.equal(aggregate.mock.calls.length, 0)
})

const thesis = () => ({
    _id: 'thesis', title: 'A thesis', date: '2025-06-15',
    person: { _id: 'graduate', firstName: 'Example', lastName: 'Graduate', genealogyId: '123', email: 'example@example.org', phone: '+39000', staff: [{isInternal: true}] },
    affiliation: { name: 'Legacy affiliation' }, institutions: [{ name: 'One' }, { name: 'Two' }, {}],
    advisors: [
        { _id: 'internal', firstName: 'Internal', lastName: 'Advisor', staffs: [{ isInternal: true }] },
        { _id: 'external', firstName: 'External', lastName: 'Advisor', staffs: [{ isInternal: false }, { isInternal: true }] },
        { _id: 'nostaff', firstName: 'Other', lastName: 'Advisor' },
    ],
})

test('configurable table preserves genealogy/contact links, advisor rule, and institutions', () => {
    queryResult = { data: [thesis()] }
    document.documentElement.lang = 'en-US'
    const html = render({ fields: 'person.lastName,person.genealogyId,person.email,person.phone,person._id,advisors,institutions', tableen: 'Surname,Genealogy,Email,Phone,Profile,Supervisors,Institutions' })
    for (const text of ['Surname', 'class="enable-sort"', 'https://www.genealogy.math.ndsu.nodak.edu/id.php?id=123', 'mailto:example@example.org', 'tel:+39000', '/en/scheda-personale/?person_id=graduate', '/en/scheda-personale/?person_id=internal', 'One, Two']) assert.ok(html.includes(text), text)
    assert.ok(html.includes('person_id=external') && !html.includes('person_id=nostaff'))
})

test('localized defaults and explicit date formats work in both languages', () => {
    queryResult = { data: [thesis()] }
    document.documentElement.lang = 'it-IT'
    assert.ok(render({ fields: 'date', table: 'Data', tableen: 'Date' }).includes('15.06.2025'))
    document.documentElement.lang = 'en-US'
    assert.ok(render({ fields: 'date', tableen: 'Date' }).includes('Jun 15, 2025'))
    assert.ok(render({ fields: 'date', date_format: 'Y-m-d' }).includes('2025-06-15'))
})

test('list mode uses plain names, singular affiliation, title, and supervised-by text', () => {
    queryResult = { data: [thesis()] }
    const html = render({ list_mode: true, fields: 'date' })
    for (const text of ['<ul>', '<li>', 'Example', 'Graduate', '(Legacy affiliation)', '&quot;A thesis&quot;', 'supervised by Internal  Advisor and External  Advisor and Other  Advisor']) assert.ok(html.includes(text), text)
    assert.ok(!html.includes('<table') && !html.includes('<a '))
    assert.ok(render({ list_mode: '0' }).includes('<table'))
    queryResult = { data: [{ _id: 'minimal', person: { firstName: 'Only', lastName: 'Name' } }] }
    assert.ok(!render({ list_mode: true }).includes('supervised by'))
})

test('old ThesisList calls retain year accordions and shortcode calls use the existing API', async () => {
    const row = thesis()
    row.advisors = []
    queryResult = { data: [row] }
    let html = render({})
    assert.ok(html.includes('c-accordion__title') && html.includes('2025'))
    html = render({ fields: 'title', filter: 'dateyear=2025' })
    assert.ok(!html.includes('c-accordion__title'))
    await fetchData()
    assert.ok(requestedUrl.startsWith('/api/v0/public/theses?_format=shortcode&'))
    assert.ok(requestedUrl.includes('date__gte=2025-01-01'))
})

test('shortcode empty messages, loading and errors use widget conventions', () => {
    queryResult = { data: [] }
    document.documentElement.lang = 'it-IT'
    assert.equal(render({ list_mode: true }), '<p>nessuna informazione</p>')
    document.documentElement.lang = 'en-US'
    assert.equal(render({ fields: 'title' }), '<p>there is no data</p>')
    assert.equal(render({ fields: 'title', no_data_message_en: 'No theses' }), '<p>No theses</p>')
    queryResult = { isLoading: true }
    assert.ok(render({ list_mode: true }).includes('Caricamento'))
    queryResult = { error: new Error('Mock error') }
    assert.ok(render({ list_mode: true }).includes('Mock error'))
})
