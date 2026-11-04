const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')

// No credentials, server startup or MongoDB connection; aggregates and HTTP are mocked.
const configPath = require.resolve('../config')
require.cache[configPath] = {
    id: configPath, filename: configPath, loaded: true,
    exports: { BASE_URL: 'http://localhost:3000', API_PATH: '/api/v0' },
}
const Staff = require('../models/Staff')
const Person = require('../models/Person')
const staffListQuery = require('../controllers/public/staff-list')
const staffQuery = require('../controllers/public/staff')
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
const { StaffList } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/StaffList.js'))
const { getShortcodeQuery } = loadWidget(path.resolve(__dirname, '../../widgets/src/shortcode-utils.js'))
const render = props => renderToStaticMarkup(React.createElement(StaffList, props))
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this }, send(body) { this.body = body; return this } })

test('staff list includes all dates by default and sorts by surname, with public fields only', async t => {
    let pipeline
    t.mock.method(Staff, 'aggregate', async stages => { pipeline = stages; return [] })
    const res = response()
    await staffListQuery({ query: {} }, res)
    assert.deepEqual(res.body.data, [])
    assert.ok(!pipeline.some(stage => stage.$match?.startDate || stage.$match?.endDate || stage.$match?.$or))
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { 'person.lastName': 1, 'person.firstName': 1 })
    const projection = pipeline.find(stage => stage.$project).$project
    assert.equal(projection.qualification, 1)
    assert.equal(projection.SSD, 1)
    assert.equal(projection.notes, undefined)
    assert.equal(projection.matricola, undefined)
    assert.equal(projection.createdBy, undefined)
    assert.ok(pipeline.some(stage => stage.$lookup?.as === 'person.affiliations'))
    assert.ok(pipeline.some(stage => stage.$lookup?.as === 'roomAssignments'))
})

test('staff list applies current, qualification, SSD and internal filters and requested sorting', async t => {
    let pipeline
    t.mock.method(Staff, 'aggregate', async stages => { pipeline = stages; return [] })
    const query = Object.fromEntries(new URLSearchParams(getShortcodeQuery('current,qualification=PO,SSD=MATH-01/A,isInternal=1', '-qualification')))
    await staffListQuery({ query }, response())
    const matches = pipeline.filter(stage => stage.$match).map(stage => stage.$match)
    assert.ok(matches.some(match => match.$or?.some(condition => condition.startDate?.$lte instanceof Date)))
    assert.ok(matches.some(match => match.$or?.some(condition => condition.endDate?.$gte instanceof Date)))
    assert.ok(matches.some(match => match.qualification === 'PO'))
    assert.ok(matches.some(match => match.SSD === 'MATH-01/A'))
    assert.ok(matches.some(match => match.isInternal === true))
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { qualification: -1 })
})

test('private filters are rejected before querying', async t => {
    const aggregate = t.mock.method(Staff, 'aggregate', async () => [])
    const res = response()
    await staffListQuery({ query: { notes: 'private' } }, res)
    assert.equal(res.statusCode, 400)
    assert.equal(aggregate.mock.calls.length, 0)
})

test('existing staff endpoint remains a single-person email lookup', async t => {
    const person = { firstName: 'Example', lastName: 'Person', staff: [] }
    t.mock.method(Person, 'aggregate', async () => [person])
    const result = await staffQuery({ query: { email: 'example@example.org' } })
    assert.equal(result.data, person)
    assert.ok(!Array.isArray(result.data))
})

test('staff widget uses shared table formatting, localized headings and the staff-list API', async () => {
    queryResult = { data: [{
        _id: 'staff', qualification: 'PO', isInternal: true, SSD: ['MATH-01/A', 'MATH-02/B'],
        person: { _id: 'person', firstName: 'Example', lastName: 'Person', email: 'example@example.org', affiliations: [{ name: 'Institution' }] },
        roomAssignment: { room: { building: 'B', floor: '1', number: '101' } }, startDate: '2025-01-15',
    }] }
    const props = {
        fields: 'person.firstName,person.lastName,qualification,SSD_name,person.affiliations,roomAssignment.room.building,roomAssignment.room.floor,person.email,person._id,startDate,isInternal',
        table: 'Nome,Cognome,Qualifica,Gruppo,Affiliazione,Edificio,Piano,Email,Profilo,Da',
        tableen: 'First Name,Last Name,Qualification,Group,Affiliation,Building,Floor,Email,Profile,From',
        filter: 'current,qualification=PO',
    }
    document.documentElement.lang = 'it-IT'
    let html = render(props)
    for (const text of ['peopletable styled-table', 'Nome', '<td>PO</td>', '<td>1</td>', 'enable-sort', 'Logica Matematica, Geometria', 'Institution', 'Edificio B', 'Primo piano', 'mailto:example@example.org', '/scheda-personale/?person_id=person', '15.01.2025']) assert.ok(html.includes(text), text)
    document.documentElement.lang = 'en-US'
    html = render(props)
    for (const text of ['First Name', 'Mathematical Logic, Geometry', 'Building B', 'First floor', '/en/scheda-personale/?person_id=person', 'Jan 15, 2025']) assert.ok(html.includes(text), text)
    await fetchData()
    assert.ok(requestedUrl.startsWith('/api/v0/public/staff-list?'))
    assert.ok(requestedUrl.includes('qualification=PO') && requestedUrl.includes('startDate__lte_or_null=today'))
})

test('staff widget preserves empty messages, loading and errors', () => {
    queryResult = { data: [] }
    document.documentElement.lang = 'it-IT'
    assert.equal(render({}), '<p>nessuna informazione</p>')
    document.documentElement.lang = 'en-US'
    assert.equal(render({}), '<p>there is no data</p>')
    assert.equal(render({ no_data_message_en: 'No staff' }), '<p>No staff</p>')
    queryResult = { isLoading: true }
    assert.ok(render({}).includes('Caricamento'))
    queryResult = { error: new Error('Mock error') }
    assert.ok(render({}).includes('Mock error'))
})
