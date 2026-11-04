const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')

// No credentials, server startup or database connection. Every aggregate is mocked.
const configPath = require.resolve('../config')
require.cache[configPath] = {
    id: configPath, filename: configPath, loaded: true,
    exports: { BASE_URL: 'http://localhost:3000', API_PATH: '/api/v0' },
}
const Visit = require('../models/Visit')
const visitListQuery = require('../controllers/public/visit-list')
const visitsQuery = require('../controllers/public/visits')
const widgetRequire = createRequire(path.resolve(__dirname, '../../widgets/package.json'))
const { transformSync } = widgetRequire('esbuild')
const React = widgetRequire('react')
const { renderToStaticMarkup } = widgetRequire('react-dom/server')
let queryResult
const document = { documentElement: { lang: 'it-IT' } }
const loaded = new Map()

function loadWidget(file) {
    if (loaded.has(file)) return loaded.get(file)
    const module = { exports: {} }
    const code = transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs' }).code
    vm.runInNewContext(code, {
        module, exports: module.exports, document, URLSearchParams,
        require(name) {
            if (name.endsWith('.css')) return {}
            if (name === 'react-query') return { useQuery: () => queryResult }
            if (name === 'axios') return { get: async () => ({ data: {} }) }
            if (name.startsWith('.')) return loadWidget(path.resolve(path.dirname(file), name + '.js'))
            return widgetRequire(name)
        },
    }, { filename: file })
    loaded.set(file, module.exports)
    return module.exports
}

const { VisitList, getVisitQuery, getVisitField } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/VisitList.js'))
function response() {
    return { statusCode: 200, status(code) { this.statusCode = code; return this }, send(body) { this.body = body; return this } }
}
const params = (filter, sort = 'person') => Object.fromEntries(new URLSearchParams(getVisitQuery(filter, sort)))
const render = props => renderToStaticMarkup(React.createElement(VisitList, props))

test('legacy filters expand to dates, preserve explicit values, and encode safely', () => {
    assert.deepEqual(params('current'), { _sort: 'person', startDate__lte_or_null: 'today', endDate__gte_or_null: 'today' })
    assert.equal(params('past').endDate__lt, 'today')
    assert.equal(params('perspective=1').startDate__gt, 'today')
    assert.deepEqual(params('year=2026'), { _sort: 'person', startDate__lte_or_null: '2026-12-31', endDate__gte_or_null: '2026-01-01' })
    assert.equal(params('dateyear=2025').date__gte, '2025-01-01')
    assert.equal(params(' publish=1, collaborationTheme=A&B=1 ').collaborationTheme, 'A&B=1')
    assert.equal(params('', '-person')._sort, '-person')
})

test('public table uses legacy date filters and surname sorting without a default date restriction', async t => {
    let pipeline
    t.mock.method(Visit, 'aggregate', async stages => { pipeline = stages; return [] })
    let res = response()
    await visitListQuery({ query: params('') }, res)
    assert.deepEqual(res.body.data, [])
    assert.ok(!pipeline.some(stage => stage.$match?.startDate || stage.$match?.endDate))
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { 'person.lastName': 1, 'person.firstName': 1 })
    res = response()
    await visitListQuery({ query: params('current,publish=1', '-person') }, res)
    const matches = pipeline.filter(stage => stage.$match).map(stage => stage.$match)
    assert.ok(matches.some(match => match.$or?.some(condition => condition.startDate?.$lte instanceof Date)))
    assert.ok(matches.some(match => match.$or?.some(condition => condition.endDate?.$gte instanceof Date)))
    assert.ok(matches.some(match => match.publish === true))
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { 'person.lastName': -1, 'person.firstName': -1 })
    const projection = pipeline.find(stage => stage.$project).$project
    assert.equal(projection.notes, undefined)
    assert.equal(projection.createdBy, undefined)
    assert.equal(projection.SSD, 1)
    assert.ok(pipeline.some(stage => stage.$lookup?.as === 'affiliations'))
})

test('public table rejects private-field filters; home visits retain their date restriction', async t => {
    const aggregate = t.mock.method(Visit, 'aggregate', async () => [])
    const res = response()
    await visitListQuery({ query: { notes: 'private' } }, res)
    assert.equal(res.statusCode, 400)
    assert.equal(aggregate.mock.calls.length, 0)
    await visitsQuery({ query: {} })
    assert.ok(aggregate.mock.calls[0].arguments[0][0].$match.$expr)
})

test('example columns render visit affiliations, localized rooms, and PHP dates', () => {
    document.documentElement.lang = 'it-IT'
    queryResult = { data: [{
        _id: 'visit', person: { firstName: 'Example', lastName: 'Visitor', affiliations: [{ name: 'Current affiliation' }] },
        affiliations: [{ name: 'Visit affiliation' }], roomAssignment: { room: { building: 'A', floor: '0', number: '101' } },
        startDate: '2026-11-03', endDate: '2026-11-20',
    }] }
    const props = {
        fields: 'person.firstName, person.lastName,affiliations,roomAssignment.room.building,roomAssignment.room.floor,roomAssignment.room.number,startDate,endDate',
        table: 'Nome,Cognome,Affiliazione,Edificio,Piano,Stanza,Da,A',
        tableen: 'First Name,Last Name,Affiliation,Building,Floor,Office,From,To', filter: 'current',
    }
    let html = render(props)
    assert.ok(html.includes('class="peopletable styled-table"') && html.includes('class="enable-sort"'))
    assert.ok(html.includes('Visit affiliation') && !html.includes('Current affiliation'))
    assert.ok(html.includes('Edificio A') && html.includes('Piano terra') && html.includes('03.11.2026'))
    document.documentElement.lang = 'en-US'
    html = render(props)
    assert.ok(html.includes('First Name') && html.includes('Building A') && html.includes('Ground floor'))
    assert.ok(html.includes('Nov 03, 2026'))
    assert.equal(getVisitField({ startDate: '2026-11-03' }, 'startDate', 'j/n/Y'), '3/11/2026')
    assert.equal(getVisitField({}, 'roomAssignment.room.floor', 'd.m.Y'), undefined)
})

test('contact links, person links, affiliation lists and both SSD representations render', () => {
    const row = { person: { _id: 'person', email: 'example@example.org', phone: '+39000', affiliations: [{ name: 'One' }, { name: 'Two' }] }, SSD: ['MATH-01/A', 'MATH-02/B'] }
    queryResult = { data: [row] }
    document.documentElement.lang = 'en-US'
    const props = { fields: 'person.email,person.phone,person._id,person.affiliations,SSD_name' }
    let html = render(props)
    for (const text of ['mailto:example@example.org', 'tel:+39000', '/en/scheda-personale/?person_id=person', 'One, Two', 'Mathematical Logic, Geometry', 'd-none d-lg-inline']) assert.ok(html.includes(text))
    row.SSD = 'MATH-03/A'
    assert.ok(render(props).includes('Mathematical Analysis'))
})

test('empty messages, loading and errors use widget conventions', () => {
    queryResult = { data: [] }
    document.documentElement.lang = 'it-IT'
    assert.equal(render({}), '<p>nessuna informazione</p>')
    document.documentElement.lang = 'en-US'
    assert.equal(render({}), '<p>there is no data</p>')
    assert.equal(render({ no_data_message_en: 'No visitors' }), '<p>No visitors</p>')
    queryResult = { isLoading: true }
    assert.ok(render({}).includes('Caricamento'))
    queryResult = { error: new Error('Mock error') }
    assert.ok(render({}).includes('Mock error'))
})
