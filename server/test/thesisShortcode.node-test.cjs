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
const { getThesisQuery } = loadWidget(path.resolve(__dirname, '../../widgets/src/thesis-query.js'))
const { sortPeopleRows, nextPeopleSort } = loadWidget(path.resolve(__dirname, '../../widgets/src/people-table-utils.js'))
const render = props => renderToStaticMarkup(React.createElement(ThesisList, props))
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this }, send(body) { this.body = body; return this } })

test('explicit thesis date filters support surname sorting and approved public fields', async t => {
    let pipeline
    t.mock.method(Thesis, 'aggregate', async stages => { pipeline = stages; return [] })
    const query = Object.fromEntries(new URLSearchParams(getThesisQuery({year:2025})))
    const res = response()
    await thesesQuery({ query: { _format: 'shortcode', ...query } }, res)
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body.data, [])
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { 'person.lastName': 1, 'person.firstName': 1 })
    assert.ok(pipeline.some(stage => stage.$match?.date?.$lt instanceof Date))
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

test('configurable table preserves genealogy/contact links, profile eligibility and institutions', () => {
    queryResult = { data: [thesis()] }
    const html = render({ en:true, columns:'name,genealogy,email,phone,advisors,institutions', headers_en:'Student,Genealogy,Email,Phone,Supervisors,Institutions' })
    for (const text of ['Student', 'aria-sort="ascending"', 'https://www.genealogy.math.ndsu.nodak.edu/id.php?id=123', 'mailto:example@example.org', 'tel:+39000', '/en/scheda-personale/?person_id=graduate', '/en/scheda-personale/?person_id=internal', 'One, Two']) assert.ok(html.includes(text), text)
    assert.ok(html.includes('person_id=external') && !html.includes('person_id=nostaff'))
    assert.ok(html.includes('href="/en/scheda-personale/?person_id=internal"><i class="fas fa-id-card fa-fw"'))
    assert.equal((html.match(/aria-hidden="true">↑/g) || []).length, 1)
})

test('localized headings and standard date styles work in both languages', () => {
    queryResult = { data: [thesis()] }
    document.documentElement.lang = 'it-IT'
    assert.ok(render({ columns:'date',date_style:'long' }).includes('15 giugno 2025'))
    assert.ok(render({ columns:'date',date_style:'long',en:true }).includes('June 15, 2025'))
    assert.ok(render({ columns:'title',en:true }).includes('Thesis title'))
})

test('group_by_year wraps all tables in newest-first year accordions with undated last', () => {
    const row = thesis()
    queryResult = { data: [row, {...row,_id:'new',date:'2026-01-01'}, {...row,_id:'undated',date:null}] }
    const flat = render({})
    assert.equal((flat.match(/<table /g) || []).length, 1)
    assert.ok(!flat.includes('c-accordion__title'))
    const grouped = render({group_by_year:'true',en:true})
    assert.equal((grouped.match(/<table /g) || []).length, 3)
    assert.ok(grouped.indexOf('>2026<') < grouped.indexOf('>2025<'))
    assert.ok(grouped.indexOf('>2025<') < grouped.indexOf('>Undated<'))
    assert.ok(!render({group_by_year:'false'}).includes('c-accordion__title'))
})

test('named filters map to the public API without display options or fields', async () => {
    const props = {year:2025,ssd:'MATH-01/A',institution:'641b8b0b840928dc5b8da2e3',qualification:['Dottorando A','Dottorando B'],exclude_qualification:'Dottorando Esterno',limit:10,group_by_year:true,columns:'title'}
    const params = new URLSearchParams(getThesisQuery(props))
    assert.equal(params.get('date__gte'), '2025-01-01')
    assert.equal(params.get('date__lt'), '2026-01-01T00:00:00.000Z')
    assert.equal(params.get('institutions'), props.institution)
    assert.equal(params.get('qualification'), 'Dottorando A,Dottorando B')
    assert.equal(params.get('exclude_qualification'), props.exclude_qualification)
    assert.equal(params.get('_limit'), '10')
    assert.equal(params.get('SSD'), props.ssd)
    assert.ok(!params.has('fields') && !params.has('columns') && !params.has('group_by_year'))
    assert.equal(new URLSearchParams(getThesisQuery({to:'2024-02-29'})).get('date__lt'), '2024-03-01T00:00:00.000Z')
    queryResult = {data:[]}
    render(props)
    await fetchData()
    assert.equal(requestedUrl, '/api/v0/public/theses?' + params)
})

test('qualification filters run before limits and do not change profile eligibility', async t => {
    let pipeline
    t.mock.method(Thesis, 'aggregate', async stages => { pipeline = stages; return [] })
    const res = response()
    const query = Object.fromEntries(new URLSearchParams(getThesisQuery({year:2025,ssd:'MATH-01/A',institution:'641b8b0b840928dc5b8da2e3',qualification:['Dottorando A','Dottorando B'],exclude_qualification:'Dottorando Esterno',limit:2})))
    await thesesQuery({query}, res)
    assert.equal(res.statusCode, 200)
    assert.equal(pipeline.find(stage => stage.$match?.institutions).$match.institutions.toString(), '641b8b0b840928dc5b8da2e3')
    assert.equal(pipeline.find(stage => stage.$match?.SSD).$match.SSD, 'MATH-01/A')
    assert.equal(pipeline.find(stage => stage.$match?.date?.$lt).$match.date.$lt.toISOString(), '2026-01-01T00:00:00.000Z')
    const matches = pipeline.filter(stage => stage.$match?.['person.staff.qualification']).map(stage => stage.$match['person.staff.qualification'])
    assert.deepEqual(matches, [{$in:['Dottorando A','Dottorando B']},{$nin:['Dottorando Esterno']}])
    assert.ok(pipeline.findIndex(stage => stage.$match?.['person.staff.qualification']) < pipeline.findIndex(stage => stage.$facet))
    assert.equal(pipeline.find(stage => stage.$facet).$facet.limiting.at(-1).$limit, 2)
    assert.ok(pipeline.find(stage => stage.$lookup?.as === 'person').$lookup.pipeline.some(stage => stage.$set?.hasPersonProfile))
})

test('invalid and legacy options fail clearly without fetching', () => {
    for (const props of [
        {exclude_institution:'invalid'},{exclude_institution:[]},{sort_by:'office'},{order:'invalid'},{fields:'title'},{filter:'dateyear=2025'},{table:'Title'},{sort_field:'person'},
        {list_mode:true},{dateyear:2025},{_limit:10},{year:2025,from:'2025-01-01'},
        {from:'2025-02-30'},{from:'2026-01-01',to:'2025-01-01'},
        {group_by_year:'yes'},{limit:0},{qualification:[]},{year:'202'},
        {columns:'office'},{columns:'name,name'},{columns:'name,title',headers:'Name'},
        {date_style:'Y-m-d'},
    ]) {
        fetchData = null
        const html = render(props)
        assert.ok(html.includes('role="alert"'), JSON.stringify(props))
        assert.equal(fetchData, null)
    }
})

test('thesis table sorting is immutable, surname-first and supports column toggling', () => {
    const rows = [
        {_id:'z',person:{firstName:'A',lastName:'Zeta'},title:'Alpha',date:'2024-01-01'},
        {_id:'a',person:{firstName:'Z',lastName:'Alpha'},title:'Zulu',date:'2025-01-01'},
        {_id:'b',person:{firstName:'A',lastName:'Alpha'},title:'Beta',date:null},
    ]
    const ids = (sort) => [...sortPeopleRows(rows, sort, true, 'thesis')].map(row => row._id).join(',')
    assert.equal(ids(), 'b,a,z')
    const ascending = nextPeopleSort({column:'last_name',order:'asc'}, 'title')
    assert.equal(ids(ascending), 'z,b,a')
    assert.equal(ids(nextPeopleSort(ascending,'title')), 'a,b,z')
    assert.equal(ids({column:'date',order:'desc'}), 'a,z,b')
    assert.equal(rows.map(row => row._id).join(','), 'z,a,b')
})

test('fixed empty messages, loading and errors use widget conventions', () => {
    queryResult = { data: [] }
    document.documentElement.lang = 'it-IT'
    assert.equal(render({}), '<p>Nessuna tesi corrisponde a questi filtri.</p>')
    assert.equal(render({en:true,group_by_year:true}), '<p>No theses match these filters.</p>')
    queryResult = { isLoading: true }
    assert.ok(render({}).includes('Caricamento'))
    queryResult = { error: new Error('Mock error') }
    assert.ok(render({}).includes('Mock error'))
})


test('institution exclusion and date ordering are applied by the API before limiting', async t => {
    let pipeline
    t.mock.method(Thesis,'aggregate',async stages => {pipeline=stages;return []})
    const excluded='641b8b0b840928dc5b8da2e3'
    const query=Object.fromEntries(new URLSearchParams(getThesisQuery({exclude_institution:excluded,sort_by:'date',order:'desc',limit:5})))
    assert.equal(query.institutions__ne,excluded)
    assert.equal(query._sort,'-date')
    const res=response()
    await thesesQuery({query},res)
    assert.equal(res.statusCode,200)
    assert.equal(pipeline.find(stage => stage.$match?.institutions).$match.institutions.$ne.toString(),excluded)
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort,{date:-1})
    assert.equal(pipeline.find(stage => stage.$facet).$facet.limiting.at(-1).$limit,5)
})

test('configured thesis date order initializes flat and grouped tables and their active header', () => {
    queryResult={data:[
        {...thesis(),_id:'old',date:'2026-01-01',person:{firstName:'Alpha',lastName:'Alpha'}},
        {...thesis(),_id:'new',date:'2026-06-01',person:{firstName:'Zulu',lastName:'Zulu'}},
    ]}
    for (const group_by_year of [false,true]) {
        let html=render({columns:'name,date',sort_by:'date',order:'desc',group_by_year})
        assert.ok(html.indexOf('Zulu Zulu') < html.indexOf('Alpha Alpha'))
        assert.ok(html.includes('data-column="date" aria-sort="descending"'))
        html=render({columns:'name,date',sort_by:'date',order:'asc',group_by_year})
        assert.ok(html.indexOf('Alpha Alpha') < html.indexOf('Zulu Zulu'))
    }
})
