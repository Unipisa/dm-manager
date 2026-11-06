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
let queryCalls = 0
let queryKey
let mountedWidget
let interactive = false
let interactiveSort
const widgetReact = { ...React, useState(initial) {
    if (!interactive) return React.useState(initial)
    interactiveSort ||= initial
    return [interactiveSort, update => { interactiveSort = typeof update === 'function' ? update(interactiveSort) : update }]
} }
const document = { documentElement: { lang: 'it-IT' }, cookie: '' }
const loaded = new Map()

function loadWidget(file) {
    if (loaded.has(file)) return loaded.get(file)
    const module = { exports: {} }
    const code = transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs' }).code
    vm.runInNewContext(code, {
        module, exports: module.exports, document, window: {}, URLSearchParams, dmwidgets: { localDevelopment: true },
        require(name) {
            if (name.endsWith('.css')) return {}
            if (name === 'react') return widgetReact
            if (name === 'react-query') return {
                useQuery(key, fn) { queryCalls++; queryKey = key; fetchData = fn; return queryResult },
                QueryClient: class {}, QueryClientProvider: ({ children }) => children,
            }
            if (name === 'react-dom/client') return { createRoot: () => ({ render(element) { mountedWidget = element.props.children } }) }
            if (name === 'axios') return { get: async url => { requestedUrl = url; return { data: { data: [] } } } }
            if (name.startsWith('.')) return loadWidget(path.resolve(path.dirname(file), name + '.js'))
            return widgetRequire(name)
        },
    }, { filename: file })
    loaded.set(file, module.exports)
    return module.exports
}
const { StaffList } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/StaffList.js'))
const { getStaffQuery } = loadWidget(path.resolve(__dirname, '../../widgets/src/staff-query.js'))
const params = props => Object.fromEntries(new URLSearchParams(getStaffQuery(props)))
const { PeopleTable: StaffTable, getPeopleTableOptions: getStaffTableOptions } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/PeopleTable.js'))
const { sortPeopleRows: sortStaffRows } = loadWidget(path.resolve(__dirname, '../../widgets/src/people-table-utils.js'))
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

test('staff list applies current, qualification, SSD and internal filters and default surname sorting', async t => {
    let pipeline
    t.mock.method(Staff, 'aggregate', async stages => { pipeline = stages; return [] })
    const query = params({ status: 'current', qualification: 'PO', ssd: 'MATH-01/A', is_internal: true })
    await staffListQuery({ query }, response())
    const matches = pipeline.filter(stage => stage.$match).map(stage => stage.$match)
    assert.ok(matches.some(match => match.$or?.some(condition => condition.startDate?.$lte instanceof Date)))
    assert.ok(matches.some(match => match.$or?.some(condition => condition.endDate?.$gte instanceof Date)))
    assert.ok(matches.some(match => match.qualification === 'PO'))
    assert.ok(matches.some(match => match.SSD === 'MATH-01/A'))
    assert.ok(matches.some(match => match.isInternal === true))
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { 'person.lastName': 1, 'person.firstName': 1 })
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

const staff = {
    _id: 'staff', qualification: 'PO', isInternal: true, SSD: ['MATH-01/A', 'MATH-02/B'],
    person: { _id: 'person', firstName: 'Example', lastName: 'Person', email: 'example@example.org', phone: '+39 123', affiliations: [{ name: 'Institution' }] },
    roomAssignment: { room: { _id: 'room', building: 'B', floor: '1', number: '101' } }, startDate: '2025-01-15', endDate: null,
}

test('named date selectors express status, a date, a year or an overlapping range', () => {
    assert.deepEqual(params({}), { _sort: 'person' })
    assert.deepEqual(params({ status: 'current' }), { _sort: 'person', startDate__lte_or_null: 'today', endDate__gte_or_null: 'today' })
    assert.equal(params({ status: 'past' }).endDate__lt, 'today')
    assert.equal(params({ status: 'future' }).startDate__gt, 'today')
    assert.deepEqual(params({ active_on: '2026-11-05' }), { _sort: 'person', endDate__gte_or_null: '2026-11-05', startDate__lte_or_null: '2026-11-05' })
    assert.deepEqual(params({ year: 2025 }), { _sort: 'person', endDate__gte_or_null: '2025-01-01', startDate__lte_or_null: '2025-12-31' })
    assert.deepEqual(params({ from: '2025-04-01', to: '2025-08-31' }), { _sort: 'person', endDate__gte_or_null: '2025-04-01', startDate__lte_or_null: '2025-08-31' })
    assert.equal(params({ from: '2025-04-01' }).startDate__lte_or_null, undefined)
    assert.equal(params({ to: '2025-08-31' }).endDate__gte_or_null, undefined)
    assert.match(params({ active_on: 'today' }).startDate__lte_or_null, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(params({ active_on: '2024-02-29' }).startDate__lte_or_null, '2024-02-29')
})

test('separate filters support multiple qualifications, explicit false and limits', () => {
    assert.deepEqual(params({ qualification: 'PO, PA,RTT,PO', ssd: 'MATH-01/A', is_internal: false, limit: '12' }), {
        _sort: 'person', qualification__in: 'PO|PA|RTT', SSD: 'MATH-01/A', isInternal: 'false', _limit: '12',
    })
    assert.equal(params({ qualification: ['PO', 'PA'] }).qualification__in, 'PO|PA')
    assert.equal(params({ qualification: 'Dottorando in Matematica' }).qualification, 'Dottorando in Matematica')
    for (const value of [true, 1, '1', 'true']) assert.equal(params({ is_internal: value }).isInternal, 'true')
    for (const value of [false, 0, '0', 'false']) assert.equal(params({ is_internal: value }).isInternal, 'false')
    assert.equal(params({ is_internal: undefined }).isInternal, undefined)
    assert.deepEqual(params({ columns: 'email', headers: 'Contact' }), params({ columns: 'name' }))
})

test('the common loader removes shortcode routing metadata for every widget', async () => {
    const entryPath = path.resolve(__dirname, '../../widgets/src/index.js')
    const { dmwidgets } = loadWidget(entryPath)
    const widgetNames = Array.from(fs.readFileSync(entryPath, 'utf8').matchAll(/case '([^']+)':/g), match => match[1])
    for (const name of widgetNames) {
        const props = { widget: name, en: true }
        dmwidgets.loadComponent({}, name, props)
        assert.equal(mountedWidget.props.widget, undefined, name)
        assert.equal(mountedWidget.props.en, true, name)
        assert.equal(props.widget, name, 'the shortcode attributes are not mutated')
    }
    queryResult = { data: [staff] }
    const props = { status: 'current', qualification: 'Dottorando in Matematica', is_internal: '1' }
    dmwidgets.loadComponent({}, 'StaffList', { widget: 'StaffList', ...props })
    assert.equal(renderToStaticMarkup(mountedWidget), render(props))
    await fetchData()
    assert.ok(!requestedUrl.includes('widget='))
    assert.ok(requestedUrl.includes('isInternal=true'))
    dmwidgets.loadComponent({}, 'StaffList', { widget: 'StaffList', qualificaton: 'PO' })
    assert.ok(renderToStaticMarkup(mountedWidget).includes('Unknown StaffList option'))
})

test('invalid and removed filter options fail clearly before querying', () => {
    for (const props of [
        { filter: 'current' }, { dateyear: 2025 }, { fields: 'person.lastName' }, { table: 'Name' },
        { qualification__regex: 'P' }, { person__ne: 'id' }, { sort_field: 'person' },
        { status: 'perspective' }, { status: 'current', year: 2026 },
        { year: 2026, from: '2026-01-01' }, { active_on: '2025-01-01', status: 'past' },
        { active_on: '2025-02-29' }, { from: '2026-99-01' }, { from: '2026-01-31', to: '2026-01-01' },
        { active_on: '2025-01-01T12:00:00Z' }, { year: '26' }, { sort: '-name' }, { order: 'up' },
        { is_internal: 'maybe' }, { limit: 0 }, { limit: '1.5' }, { qualification: [] }, { qualification: [1] }, { qualification: 'PO|PA' },
        { person_id: 'id' }, { research_group: 'SSD' }, { search: 'x' }, { empty_message: 'x' },
        { start_from: '2026-05-10', start_to: '2026-05-01' }, { start_from: '2026-99-01' },
        { columns: 'unknown' }, { columns: 'building' }, { columns: 'floor' }, { columns: 'profile' }, { columns: [] }, { columns: 'name,name' },
        { columns: 'name,email', headers: ['Name'] }, { date_style: 'Y-m-d' },
    ]) {
        queryCalls = 0
        const html = render(props)
        assert.ok(html.includes('role="alert"'), JSON.stringify(props))
        assert.equal(queryCalls, 0, JSON.stringify(props))
    }
})

test('staff widget has useful default columns and automatic localized headings', async () => {
    queryResult = { data: [staff] }
    document.documentElement.lang = 'it-IT'
    let html = render({ status: 'current', qualification: 'PO' })
    for (const text of ['peopletable styled-table', 'Nome', 'Qualifica', 'Gruppo di ricerca', 'Example Person', 'Logica Matematica, Geometria', 'Edificio B', 'Primo piano', 'mailto:example@example.org', '/scheda-personale/?person_id=person']) assert.ok(html.includes(text), text)
    assert.ok(!html.includes('scope="col">Telefono'))
    document.documentElement.lang = 'en-US'
    html = render({ status: 'current', qualification: 'PO' })
    for (const text of ['Name', 'Research group', 'Mathematical Logic, Geometry', 'Building B', 'First floor', '/en/scheda-personale/?person_id=person']) assert.ok(html.includes(text), text)
    await fetchData()
    assert.ok(requestedUrl.startsWith('/api/v0/public/staff-list?'))
    assert.ok(requestedUrl.includes('qualification=PO') && requestedUrl.includes('startDate__lte_or_null=today'))
    assert.equal(queryKey[0], 'stafflist')
})

test('columns choose and order visible data; headers override defaults', () => {
    queryResult = { data: [staff] }
    document.documentElement.lang = 'it-IT'
    let html = render({ columns: ['email', 'name'], headers: ['Contatto', 'Persona'] })
    assert.ok(html.indexOf('Contatto') < html.indexOf('Persona'))
    assert.ok(html.includes('mailto:example@example.org'))
    assert.ok(!html.includes('data-column="qualification"'))
    html = render({ columns: 'email,name', headers: 'Contatto,Persona', headers_en: 'Contact,Person', en: true })
    assert.ok(html.includes('Contact') && html.includes('Person'))
    assert.ok(html.includes('/en/scheda-personale/'))
    assert.ok(!html.includes('Contatto'))
    html = render({ columns: 'first_name,last_name,phone,affiliations,is_internal,name' })
    for (const text of ['Example', 'Person', 'tel:+39 123', 'Institution', 'Sì', 'fa-id-card fa-fw']) assert.ok(html.includes(text), text)
})

test('dates use localized styles; absent or invalid values stay blank', () => {
    queryResult = { data: [staff] }
    document.documentElement.lang = 'it-IT'
    let html = render({ columns: 'start_date,end_date', date_style: 'medium' })
    assert.ok(html.includes(new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(new Date(staff.startDate))))
    assert.ok(html.includes('<td data-column="end_date"></td>'))
    html = render({ columns: 'start_date', date_style: 'long', en: true })
    assert.ok(html.includes('January 15, 2025'))
    queryResult = { data: [{ person: null, startDate: 'not a date', roomAssignment: null }] }
    html = render({ columns: 'name,email,office,start_date' })
    assert.ok(!html.includes('undefined') && !html.includes('Invalid'))
    assert.equal((html.match(/<td[^>]*><\/td>/g) || []).length, 4)
})

test('staff widget supports localized empty messages, loading and errors', () => {
    queryResult = { data: [] }
    document.documentElement.lang = 'it-IT'
    assert.equal(render({}), '<p>Nessun membro del personale corrisponde a questi filtri.</p>')
    document.documentElement.lang = 'en-US'
    assert.equal(render({}), '<p>No staff match these filters.</p>')
    queryResult = { isLoading: true }
    assert.ok(render({}).includes('Caricamento'))
    queryResult = { error: new Error('Mock error') }
    assert.ok(render({}).includes('Mock error'))
})


test('the current internal teaching-staff shortcode retains its complete filter semantics', async t => {
    let pipeline
    t.mock.method(Staff, 'aggregate', async stages => { pipeline = stages; return [] })
    const props = {
        columns: 'name,qualification,email',
        headers: 'Nome,Qualifica,Email',
        qualification: 'PO,PA,RTDa,RTDb,RTT,RIC', is_internal: true, status: 'current',
    }
    await staffListQuery({ query: params(props) }, response())
    const matches = pipeline.filter(stage => stage.$match).map(stage => stage.$match)
    assert.ok(matches.some(match => JSON.stringify(match.qualification?.$in) === JSON.stringify(['PO', 'PA', 'RTDa', 'RTDb', 'RTT', 'RIC'])))
    assert.ok(matches.some(match => match.isInternal === true))
    assert.ok(matches.some(match => match.$or?.some(condition => condition.startDate?.$lte instanceof Date)))
    assert.ok(matches.some(match => match.$or?.some(condition => condition.endDate?.$gte instanceof Date)))
    queryResult = { data: [staff] }
    document.documentElement.lang = 'it-IT'
    const html = render(props)
    for (const heading of ['Nome', 'Qualifica', 'Email']) assert.ok(html.includes(heading))
    assert.ok(html.includes('/scheda-personale/?person_id=person'))
    assert.ok(html.includes('fa-id-card fa-fw'))
    assert.ok(!html.includes('Scheda Personale'))
})

test('the PhD shortcode uses an inclusive start-date range without adding an overlap/current filter', async t => {
    let pipeline
    t.mock.method(Staff, 'aggregate', async stages => { pipeline = stages; return [] })
    const props = {
        columns: 'name,ssd,email',
        headers: 'Name,Research Group,Email', en: true,
        qualification: 'Dottorando in Matematica', is_internal: true,
        start_from: '2025-11-01', start_to: '2026-10-30',
    }
    const query = params(props)
    assert.equal(query.startDate__gte, '2025-11-01')
    assert.equal(query.startDate__lte, '2026-10-30')
    assert.equal(query.endDate__gte_or_null, undefined)
    await staffListQuery({ query }, response())
    const matches = pipeline.filter(stage => stage.$match).map(stage => stage.$match)
    assert.ok(matches.some(match => match.qualification === 'Dottorando in Matematica'))
    assert.ok(matches.some(match => match.isInternal === true))
    assert.ok(matches.some(match => match.startDate?.$gte?.toISOString() === '2025-11-01T00:00:00.000Z'))
    assert.ok(matches.some(match => match.startDate?.$lte?.toISOString() === '2026-10-30T00:00:00.000Z'))
    assert.ok(!matches.some(match => match.endDate || match.$or))
    queryResult = { data: [staff] }
    const html = render(props)
    for (const text of ['Name', 'Research Group', 'Email', 'Mathematical Logic, Geometry']) assert.ok(html.includes(text))
})

test('sorting handles surname defaults, numbers, localized labels, dates and missing values without mutating data', () => {
    const rows = [
        { _id: 'z', person: { firstName: 'Ada', lastName: 'Zulu' }, roomAssignment: {room: {number: '2', floor: '1'}}, startDate: '2025-02-01', SSD: ['MATH-02/B'] },
        { _id: 'a', person: { firstName: 'Zoe', lastName: 'Alpha' }, roomAssignment: {room: {number: '10', floor: '0'}}, startDate: '2024-12-01', SSD: ['MATH-02/A'] },
        { _id: 'b', person: { firstName: 'Bea', lastName: 'Beta' }, roomAssignment: {room: {number: '1', floor: '2'}}, startDate: null, SSD: [] },
    ]
    const ids = (column, order) => Array.from(sortStaffRows(rows, {column, order}, true), row => row._id)
    assert.deepEqual(Array.from(sortStaffRows(rows), row => row._id), ['a', 'b', 'z'])
    assert.deepEqual(ids('office', 'asc'), ['a', 'z', 'b'])
    assert.deepEqual(ids('office', 'desc'), ['b', 'z', 'a'])
    assert.deepEqual(ids('ssd', 'asc'), ['a', 'z', 'b'])
    assert.deepEqual(ids('start_date', 'asc'), ['a', 'z', 'b'])
    assert.deepEqual(ids('start_date', 'desc'), ['z', 'a', 'b'])
    assert.deepEqual(rows.map(row => row._id), ['z', 'a', 'b'])
})

test('clickable data headers switch ascending/descending locally and expose accessible sort state', () => {
    const rows = [
        { _id: 'z', person: { firstName: 'Ada', lastName: 'Zulu' }, roomAssignment: {room: {number: '2'}} },
        { _id: 'a', person: { firstName: 'Zoe', lastName: 'Alpha' }, roomAssignment: {room: {number: '10'}} },
        { _id: 'b', person: { firstName: 'Bea', lastName: 'Beta' }, roomAssignment: {room: {number: '1'}} },
    ]
    const tableProps = {data: rows, ...getStaffTableOptions({columns: 'first_name,last_name,office'}), en: true}
    const nodes = value => !value || typeof value !== 'object' ? [] : Array.isArray(value)
        ? value.flatMap(nodes) : [value, ...nodes(value.props?.children)]
    const click = (tree, label) => nodes(tree).find(node => node.type === 'button' && node.props.children[0] === label).props.onClick()
    const order = tree => nodes(tree).filter(node => node.type === 'tr' && node.key != null).map(node => node.key)
    const originalCalls = queryCalls
    interactive = true
    interactiveSort = undefined
    try {
        let tree = StaffTable(tableProps)
        assert.deepEqual(order(tree), ['a', 'b', 'z'])
        assert.equal((renderToStaticMarkup(tree).match(/[↑↓]/g) || []).length, 1)
        assert.ok(!renderToStaticMarkup(tree).includes('↕'))
        assert.ok(nodes(tree).some(node => node.type === 'th' && node.props['aria-sort'] === 'ascending'))
        click(tree, 'First name')
        tree = StaffTable(tableProps)
        assert.deepEqual(order(tree), ['z', 'b', 'a'])
        click(tree, 'First name')
        tree = StaffTable(tableProps)
        assert.deepEqual(order(tree), ['a', 'b', 'z'])
        assert.ok(nodes(tree).some(node => node.type === 'th' && node.props['aria-sort'] === 'descending'))
        click(tree, 'Office')
        tree = StaffTable(tableProps)
        assert.deepEqual(order(tree), ['b', 'z', 'a'])
        click(tree, 'Office')
        assert.deepEqual(order(StaffTable(tableProps)), ['a', 'z', 'b'])
        assert.equal(nodes(tree).filter(node => node.type === 'button').length, 3, 'all displayed columns are sortable')
        assert.equal(queryCalls, originalCalls, 'sorting makes no new API request')
    } finally { interactive = false }
})


test('office is the sole location column, with localized building/floor and a room map link', () => {
    const defaults = Array.from(getStaffTableOptions().columns)
    assert.ok(defaults.includes('office'))
    assert.ok(!defaults.includes('building') && !defaults.includes('floor'))
    for (const [en, location, label, route] of [
        [false, 'Edificio B, Primo piano', 'Stanza 101', '/mappa?sel=room'],
        [true, 'Building B, First floor', 'Room 101', '/map?sel=room'],
    ]) {
        queryResult = { data: [staff] }
        let html = render({ columns: 'office', en })
        assert.ok(html.includes(location))
        assert.ok(html.includes(label))
        assert.ok(html.includes(route))
        assert.ok(!html.includes('data-column="building"') && !html.includes('data-column="floor"'))
        queryResult = { data: [{...staff, roomAssignment: {room: {building: 'B', floor: 0, number: '101'}}}] }
        html = render({ columns: 'office', en })
        assert.ok(html.includes(en ? 'Ground floor' : 'Piano terra'))
        assert.ok(html.includes(label))
        assert.ok(!html.includes('<a ') && !html.includes('undefined'))
    }
    queryResult = { data: [{...staff, roomAssignment: null}] }
    assert.ok(render({columns: 'office'}).includes('<td data-column="office"></td>'))
    queryResult = { data: [{...staff, roomAssignment: {room: {building: 'A'}}}] }
    const partial = render({columns: 'office', en: true})
    assert.ok(partial.includes('Building A'))
    assert.ok(!partial.includes('undefined') && !partial.includes('<a '))
})
