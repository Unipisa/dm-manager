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
let queryCalls = 0
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
            if (name === 'react-query') return { useQuery(key, fn) { queryCalls++; fetchData = fn; return queryResult } }
            if (name === 'axios') return { get: async url => { requestedUrl = url; return { data: {data: []} } } }
            if (name.startsWith('.')) return loadWidget(path.resolve(path.dirname(file), name + '.js'))
            return widgetRequire(name)
        },
    }, { filename: file })
    loaded.set(file, module.exports)
    return module.exports
}

const { VisitList } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/VisitList.js'))
const { getVisitQuery } = loadWidget(path.resolve(__dirname, '../../widgets/src/visit-query.js'))
const { getStaffQuery } = loadWidget(path.resolve(__dirname, '../../widgets/src/staff-query.js'))
const { sortPeopleRows } = loadWidget(path.resolve(__dirname, '../../widgets/src/people-table-utils.js'))
function response() {
    return { statusCode: 200, status(code) { this.statusCode = code; return this }, send(body) { this.body = body; return this } }
}
const params = props => Object.fromEntries(new URLSearchParams(getVisitQuery(props)))
const render = props => renderToStaticMarkup(React.createElement(VisitList, props))
const visit = {
    _id: 'visit',
    person: { _id: 'person', hasPersonProfile: true, firstName: 'Example', lastName: 'Visitor', email: 'example@example.org', phone: '+39000', affiliations: [{ name: 'Current affiliation' }] },
    affiliations: [{ name: 'Visit affiliation' }],
    roomAssignment: { room: { _id: 'room', building: 'A', floor: '0', number: '101' } },
    startDate: '2026-11-03', endDate: '2026-11-20', SSD: 'MATH-01/A', tags: ['INdAM Visiting Fellow'],
    collaborationTheme: 'Theme', publish: true,
}

test('explicit date filters have identical semantics in StaffList and VisitList', () => {
    for (const props of [
        {}, {status: 'current'}, {status: 'past'}, {status: 'future'},
        {year: 2026}, {active_on: '2026-11-06'}, {active_on: 'today'},
        {from: '2026-01-01', to: '2026-12-31'}, {from: '2026-01-01'}, {to: '2026-12-31'},
        {start_from: '2025-11-01', start_to: '2026-10-30'}, {status: 'current', start_from: '2026-01-01'}, {limit: '5'},
    ]) assert.equal(getVisitQuery(props), getStaffQuery(props))
    assert.deepEqual(params({}), {_sort: 'person'})
    assert.equal(params({status: 'past'}).endDate__lt, 'today')
    assert.equal(params({status: 'future'}).startDate__gt, 'today')
    assert.equal(params({year: 2026}).startDate__lte_or_null, '2026-12-31')
    assert.equal(params({start_from: '2025-11-01'}).startDate__gte, '2025-11-01')
})

test('ssd is the only visit-specific filter; display options do not affect the query', () => {
    assert.deepEqual(params({ssd: 'MATH-01/A'}), { _sort: 'person', SSD: 'MATH-01/A' })
    assert.equal(params({}).publish, undefined)
    assert.equal(params({}).collaborationTheme, undefined)
    assert.deepEqual(params({columns: 'email', headers: 'Contact', group_by_year:true}), params({columns: 'name'}))
})

test('the public visit endpoint accepts generated filters and retains its public projection', async t => {
    let pipeline
    t.mock.method(Visit, 'aggregate', async stages => { pipeline = stages; return [] })
    const res = response()
    await visitListQuery({query: params({status: 'current', ssd: 'MATH-01/A'})}, res)
    assert.equal(res.statusCode, 200)
    const matches = pipeline.filter(stage => stage.$match).map(stage => stage.$match)
    assert.ok(matches.some(match => match.$or?.some(condition => condition.startDate?.$lte instanceof Date)))
    assert.ok(matches.some(match => match.$or?.some(condition => condition.endDate?.$gte instanceof Date)))
    assert.ok(!matches.some(match => 'publish' in match))
    assert.ok(matches.some(match => match.SSD === 'MATH-01/A'))
    assert.ok(!matches.some(match => 'collaborationTheme' in match))
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, {'person.lastName': 1, 'person.firstName': 1})
    const projection = pipeline.find(stage => stage.$project).$project
    assert.equal(projection.notes, undefined)
    assert.equal(projection.createdBy, undefined)
    assert.equal(projection.SSD, 1)
    assert.ok(pipeline.some(stage => stage.$lookup?.as === 'affiliations'))
    assert.ok(pipeline.some(stage => stage.$lookup?.as === 'roomAssignments'))
})

test('default visit API queries include all periods, while homepage visits keep their current restriction', async t => {
    const aggregate = t.mock.method(Visit, 'aggregate', async () => [])
    await visitListQuery({query: params({})}, response())
    const stages = aggregate.mock.calls[0].arguments[0]
    assert.ok(!stages.some(stage => stage.$match?.startDate || stage.$match?.endDate || stage.$match?.$or))
    await visitsQuery({query: {}})
    assert.ok(aggregate.mock.calls[1].arguments[0][0].$match.$expr)
    const res = response()
    await visitListQuery({query: {notes: 'private'}}, res)
    assert.equal(res.statusCode, 400)
    assert.equal(aggregate.mock.calls.length, 2)
})

test('invalid, legacy and staff-only options are rejected before any request', () => {
    for (const props of [
        {group_by_year:'yes'}, {filter: 'current'}, {fields: 'person.lastName'}, {table: 'Name'}, {tableen: 'Name'}, {sort_field: 'person'},
        {dateyear: 2026}, {date_format: 'd.m.Y'}, {no_data_message: 'None'}, {empty_message: 'None'},
        {person_id: 'id'}, {affiliations__ne: 'id'}, {collaborationTheme__regex: 'x'}, {search: 'x'},
        {qualification: 'PO'}, {is_internal: true}, {tags: 'INdAM Visiting Fellow'}, {research_group: 'code'},
        {publish: true}, {publish: false}, {ssd: []}, {collaboration_theme: 'Theme'}, {status: 'current', year: 2026},
        {from: '2026-12-31', to: '2026-01-01'}, {active_on: '2025-02-29'},
        {columns: 'qualification'}, {columns: 'is_internal'}, {columns: 'building'}, {columns: 'profile'},
        {columns: []}, {columns: 'name,name'}, {columns: 'name,email', headers: 'One'},
    ]) {
        queryCalls = 0
        const html = render(props)
        assert.ok(html.includes('role="alert"'), JSON.stringify(props))
        assert.equal(queryCalls, 0)
    }
})

test('default columns use visit-time affiliations, linked names and combined office details', async () => {
    document.documentElement.lang = 'it-IT'
    queryResult = {data: [visit]}
    const html = render({status: 'current'})
    for (const text of ['dm-people-table-scroll', 'Lista delle visite', 'Example Visitor', 'Visit affiliation', 'Edificio A', 'Piano terra', 'Stanza 101', '/mappa?sel=room', '/scheda-personale/?person_id=person', 'fa-id-card', 'aria-sort="ascending"']) assert.ok(html.includes(text), text)
    assert.ok(!html.includes('Current affiliation'))
    assert.ok(!html.includes('data-column="building"') && !html.includes('data-column="floor"'))
    assert.equal((html.match(/[↑↓]/g) || []).length, 1)
    assert.ok(!html.includes('↕'))
    await fetchData()
    assert.ok(requestedUrl.startsWith('/api/v0/public/visit-list?'))
    assert.ok(requestedUrl.includes('startDate__lte_or_null=today'))
})

test('custom columns and localized headings preserve contacts, research areas and visit-specific data', () => {
    queryResult = {data: [visit]}
    document.documentElement.lang = 'it-IT'
    const props = {
        columns: 'name,email,phone,affiliations,current_affiliations,ssd,tags,publish,collaboration_theme',
        headers_en: 'Name,Email,Phone,Affiliation,Current affiliation,Research group,Tags,Published,Theme', en: true,
    }
    let html = render(props)
    for (const text of ['Visit list', 'mailto:example@example.org', 'tel:+39000', '/en/scheda-personale/?person_id=person', 'Visit affiliation', 'Current affiliation', 'Mathematical Logic', 'INdAM Visiting Fellow', '>Yes<', 'Theme']) assert.ok(html.includes(text), text)
    queryResult = {data: [{...visit, SSD: ['MATH-01/A', 'MATH-02/B'], publish: false}]}
    html = render(props)
    assert.ok(html.includes('Mathematical Logic, Geometry') && html.includes('>No<'))
    html = render({columns: 'name,email', headers: 'Persona,Contatto'})
    assert.ok(html.includes('Persona') && html.includes('Contatto'))
})

test('localized dates use modern date styles and never replace missing dates with today', () => {
    queryResult = {data: [{...visit, endDate: null}]}
    document.documentElement.lang = 'it-IT'
    let html = render({columns: 'start_date,end_date', date_style: 'medium'})
    assert.ok(html.includes(new Intl.DateTimeFormat('it-IT', {dateStyle: 'medium'}).format(new Date(visit.startDate))))
    assert.ok(html.includes('<td data-column="end_date"></td>'))
    html = render({columns: 'start_date', date_style: 'long', en: true})
    assert.ok(html.includes('November 3, 2026'))
    queryResult = {data: [{person: null, startDate: 'invalid', roomAssignment: null}]}
    html = render({columns: 'name,email,office,start_date'})
    assert.equal((html.match(/<td[^>]*><\/td>/g) || []).length, 4)
    assert.ok(!html.includes('undefined') && !html.includes('Invalid'))
})

test('visit sorting uses recorded affiliations and visit flags rather than current person data', () => {
    const rows = [
        {...visit, _id: 'a', affiliations: [{name: 'Zulu'}], person: {...visit.person, affiliations: [{name: 'Alpha'}]}, publish: true},
        {...visit, _id: 'b', affiliations: [{name: 'Alpha'}], person: {...visit.person, affiliations: [{name: 'Zulu'}]}, publish: false},
    ]
    const ids = (column, order = 'asc') => Array.from(sortPeopleRows(rows, {column, order}, true, 'visit'), row => row._id)
    assert.deepEqual(ids('affiliations'), ['b', 'a'])
    assert.deepEqual(ids('affiliations', 'desc'), ['a', 'b'])
    assert.deepEqual(ids('current_affiliations'), ['a', 'b'])
    assert.deepEqual(ids('publish'), ['b', 'a'])
    assert.deepEqual(rows.map(row => row._id), ['a', 'b'])
})

test('empty messages are fixed and localized; loading and errors retain the visit label', () => {
    queryResult = {data: []}
    document.documentElement.lang = 'it-IT'
    assert.equal(render({}), '<p>Nessuna visita corrisponde a questi filtri.</p>')
    document.documentElement.lang = 'en-US'
    assert.equal(render({}), '<p>No visits match these filters.</p>')
    queryResult = {isLoading: true}
    assert.ok(render({}).includes('Lista delle visite'))
    queryResult = {error: new Error('Mock error')}
    assert.ok(render({}).includes('Mock error'))
})


test('group_by_year uses visit start years once each, newest first, with undated last', async () => {
    queryResult = {data: [
        {...visit, _id:'old', startDate:'2024-12-31', endDate:'2026-01-01'},
        {...visit, _id:'new', startDate:'2026-01-01'},
        {...visit, _id:'missing', startDate:null},
        {...visit, _id:'invalid', startDate:'invalid'},
        {...visit, _id:'same', startDate:'2026-12-31T23:00:00Z'},
    ]}
    const html = render({group_by_year:'true', en:true, columns:'name', headers_en:'Visitor'})
    assert.equal((html.match(/<table /g) || []).length, 3)
    assert.ok(html.indexOf('>2026<') < html.indexOf('>2024<'))
    assert.ok(html.indexOf('>2024<') < html.indexOf('>Undated<'))
    assert.ok(!html.includes('>2025<'))
    assert.equal((html.match(/Example Visitor/g) || []).length, 5)
    assert.equal((html.match(/>Visitor(?: |<)/g) || []).length, 3)
    for (const props of [{}, {group_by_year:false}, {group_by_year:'false'}, {group_by_year:'0'}]) {
        const flat = render(props)
        assert.equal((flat.match(/<table /g) || []).length, 1)
        assert.ok(!flat.includes('c-accordion__title'))
    }
    document.documentElement.lang = 'it-IT'
    assert.ok(render({group_by_year:1,en:false}).includes('>Senza data<'))
    await fetchData()
    assert.ok(!requestedUrl.includes('group_by_year'))
    queryResult = {data:[]}
    assert.equal(render({group_by_year:true,en:true}), '<p>No visits match these filters.</p>')
})
