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
const { GrantList } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/GrantList.js'))
const { Grant: GrantDetail, KeyPerson } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/Grant.js'))
const renderDetail = props => renderToStaticMarkup(React.createElement(GrantDetail, {grant_id:'grant',...props}))
const { getGrantQuery } = loadWidget(path.resolve(__dirname, '../../widgets/src/grant-query.js'))
const { getVisitQuery } = loadWidget(path.resolve(__dirname, '../../widgets/src/visit-query.js'))
const render = props => renderToStaticMarkup(React.createElement(GrantList, props))
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this }, send(body) { this.body = body; return this } })

test('named current filters and descending start-date sorting preserve public staff data', async t => {
    let pipeline
    t.mock.method(Grant, 'aggregate', async stages => { pipeline = stages; return [] })
    const query = Object.fromEntries(new URLSearchParams(getGrantQuery({status:'current',order:'desc'})))
    const res = response()
    await grantsQuery({ query: { _format: 'shortcode', ...query } }, res)
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body.data, [])
    assert.ok(pipeline.some(stage => stage.$match?.$or?.some(condition => condition.startDate?.$lte instanceof Date)))
    assert.ok(pipeline.some(stage => stage.$match?.$or?.some(condition => condition.endDate?.$gte instanceof Date)))
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort, { startDate: -1 })
    const projection = pipeline.find(stage => stage.$project).$project
    assert.equal(projection.SSD, 1)
    assert.equal(projection.funds, 1)
    assert.equal(projection.notes, undefined)
    for (const field of ['pi', 'localCoordinator']) {
        assert.equal(projection[field].staffs, `$${field}.staff`)
        assert.deepEqual(projection[field].affiliations, {_id:1,name:1})
        const affiliations = pipeline.find(stage => stage.$lookup?.as === `${field}.affiliations`).$lookup
        assert.equal(affiliations.localField, `${field}.affiliations`)
        assert.deepEqual(affiliations.pipeline, [{$project:{_id:1,name:1}}])
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

test('list preserves classes, localized project/person links, labels and Italian dates', () => {
    document.documentElement.lang = 'it-IT'
    queryResult = { data: [grant()] }
    const html = render({})
    for (const text of ['class="dm-grant-list" role="list"', 'class="dm-grant-panel currentmath-01/a, math-02/b National"', '/research/grant-details/?grant_id=grant', 'Example project', 'class="dm-grant-type">PRIN</span>', 'Principal Investigator', '/scheda-personale/?person_id=internal', 'Coordinatore dell’unità di ricerca', '/scheda-personale/?person_id=external', 'Periodo del progetto', new Intl.DateTimeFormat('it-IT',{dateStyle:'short'}).format(new Date('2025-01-15')), new Intl.DateTimeFormat('it-IT',{dateStyle:'short'}).format(new Date('2026-12-20'))]) assert.ok(html.includes(text), text)
    assert.ok(html.includes('person_id=external'))
})

test('same-person coordinator is omitted and a coordinator without a PI is supported', () => {
    document.documentElement.lang = 'en-US'
    const row = grant()
    row.localCoordinator = row.pi
    queryResult = { data: [row] }
    assert.ok(!render({}).includes('Coordinator of the Research Unit'))
    row.pi = null
    row.projectType = ''
    row.localCoordinator.staffs = []
    const html = render({})
    assert.ok(!html.includes('Principal Investigator') && !html.includes('dm-grant-type'))
    assert.ok(html.includes('Coordinator of the Research Unit') && html.includes('<em>Internal Person</em>'))
})

test('en and date_style localize labels, profile links and dates; requests use named filters', async () => {
    queryResult = { data: [grant()] }
    document.documentElement.lang = 'it-IT'
    assert.ok(render({date_style:'long'}).includes('15 gennaio 2025'))
    const html = render({en:true,date_style:'long',sort_by:'start_date',order:'desc',year:2025})
    for (const text of ['January 15, 2025','Project period','Coordinator of the Research Unit','/en/scheda-personale/?person_id=internal']) assert.ok(html.includes(text), text)
    await fetchData()
    const params = new URLSearchParams(requestedUrl.split('?')[1])
    assert.equal(params.get('_format'), 'shortcode')
    assert.equal(params.get('_sort'), '-startDate')
    assert.equal(params.get('endDate__gte_or_null'), '2025-01-01')
    assert.ok(!params.has('date_style') && !params.has('en'))
})

test('all period and limit selectors share VisitList semantics', () => {
    for (const props of [{},{status:'current'},{status:'past'},{status:'future'},{active_on:'today'},{active_on:'2026-01-01'},
        {year:2025},{from:'2025-01-01',to:'2026-12-31'},{from:'2025-01-01'},{to:'2026-12-31'},
        {start_from:'2025-01-01',start_to:'2025-12-31'},{limit:'3'}]) {
        const actual = new URLSearchParams(getGrantQuery(props))
        actual.delete('_format')
        actual.set('_sort','person')
        assert.equal(actual.toString(),getVisitQuery(props))
    }
})

test('SSD filtering and named sorting are applied before limiting', async t => {
    let pipeline
    t.mock.method(Grant,'aggregate',async stages => {pipeline = stages; return []})
    const props = {ssd:'MATH-01/A',sort_by:'name',order:'desc',limit:5}
    const query = Object.fromEntries(new URLSearchParams(getGrantQuery(props)))
    const res = response()
    await grantsQuery({query},res)
    assert.equal(res.statusCode,200,JSON.stringify(res.body))
    const matches = pipeline.filter(stage => stage.$match).map(stage => stage.$match)
    assert.ok(matches.some(match => match.SSD === 'MATH-01/A'))
    assert.deepEqual(pipeline.find(stage => stage.$sort).$sort,{name:-1})
    assert.equal(pipeline.find(stage => stage.$facet).$facet.limiting.at(-1).$limit,5)
})

test('legacy options, modifiers and invalid named values fail before requesting data', () => {
    for (const props of [
        {filter:'current'},{sort_field:'startDate'},{fields:'name'},{table:'Name'},
        {date_format:'Y-m-d'},{no_data_message:'None'},{no_data_message_en:'None'},{empty_message:'None'},
        {name__regex:'x'},{pi__ne:'id'},{dateyear:2025},{search:'x'},{columns:'name'},
        {status:'current',year:2025},{from:'2025-02-30'},{from:'2026-01-01',to:'2025-01-01'},
        {limit:0},{sort_by:'description'},{order:'up'},{date_style:'invalid'},
        {funds:'National'},{project_type:'PRIN'},{funding_entity:'Entity'},{name:'Name'},{identifier:'ID'},{cup:'CUP'},
        {pi_id:'641b8b0b840928dc5b8da2e3'},{local_coordinator_id:'641b8b0b840928dc5b8da2e3'},{member_id:'641b8b0b840928dc5b8da2e3'},
        {sort_by:'funds'},{sort_by:'project_type'},{sort_by:'funding_entity'},{ssd:[]},
    ]) {
        fetchData = null
        assert.ok(render(props).includes('role="alert"'),JSON.stringify(props))
        assert.equal(fetchData,null)
    }
})

test('missing and invalid dates are omitted; one-sided periods retain their meaning', () => {
    document.documentElement.lang = 'it-IT'
    queryResult = {data:[{...grant(),startDate:null,endDate:'invalid'}]}
    let html = render({en:true})
    assert.ok(!html.includes('Project period') && !html.includes('Invalid Date'))
    queryResult = {data:[{...grant(),endDate:null}]}
    html = render({en:true,date_style:'long'})
    assert.ok(html.includes('From') && html.includes('January 15, 2025'))
    queryResult = {data:[{...grant(),startDate:null}]}
    html = render({en:true,date_style:'long'})
    assert.ok(html.includes('Until') && html.includes('December 20, 2026'))
})

test('fixed localized empty messages, loading and errors use widget conventions', () => {
    queryResult = { data: [] }
    document.documentElement.lang = 'it-IT'
    assert.equal(render({}), '<p>Nessun finanziamento corrisponde a questi filtri.</p>')
    assert.equal(render({en:true}), '<p>No grants match these filters.</p>')
    queryResult = { isLoading: true }
    assert.ok(render({}).includes('Caricamento'))
    queryResult = { error: new Error('Mock error') }
    assert.ok(render({}).includes('Mock error'))
})


test('affiliations are shown only for investigators and coordinators without a department profile', () => {
    const affiliations = [{name:'First institution'},{name:'Second institution'},{name:'First institution'},{}]
    for (const [staffData, show] of [
        [{staffs:[{isInternal:true}]}, false],
        [{staff:[{isInternal:false},{isInternal:true}]}, false],
        [{staff:{isInternal:true}}, false],
        [{staffs:[{isInternal:false}],hasPersonProfile:true}, false],
        [{staffs:[{qualification:'ex Docente',isInternal:false}],hasPersonProfile:true}, false],
        [{}, true],
    ]) {
        for (const field of ['pi','localCoordinator']) {
            const row = grant()
            row[field] = {_id:'person',firstName:'Example',lastName:'Person',...staffData,affiliations}
            queryResult = {data:[row]}
            const html = render({})
            assert.equal(html.includes('(First institution, Second institution)'),show,`${field}: ${JSON.stringify(staffData)}`)
        }
    }
    queryResult = {data:[{...grant(),pi:{...grant().pi,affiliations:[]}}]}
    assert.ok(!render({}).includes('dm-grant-affiliations'))
})


test('grant details retain all project information in the new facts/contact layout', () => {
    const row = {...grant(),fundingEntity:'Funding body',budgetAmount:'€100,000',webSite:'https://example.org/project',
        description:'Project **description** with $x^2$.',members:[{_id:'member',firstName:'Member',lastName:'Name'}]}
    queryResult = {data:row}
    const html = renderDetail({en:true})
    for (const text of ['dm-grant-detail','Example project','PRIN','Funded by','Funding body','January 15, 2025',
        'December 20, 2026','€100,000','href="https://example.org/project" target="_blank" rel="noopener noreferrer"',
        'Principal Investigator','Local Coordinator','Internal Person','External Person','Participants','Member Name',
        'Description','<strong>description</strong>','katex','dm-widget-accordion']) assert.ok(html.includes(text),text)
    assert.equal((html.match(/dm-grant-contact-name/g) || []).length,2)
})

test('internal staff and former faculty have recognizable profile links without affiliations', () => {
    for (const staff of [{isInternal:true},{isInternal:false,qualification:'ex Docente'}]) {
        const person = {_id:'person',firstName:'Example',lastName:'Name',staff:[{isInternal:false},staff],affiliations:[{name:'Hidden institution'}]}
        const html = renderToStaticMarkup(React.createElement(KeyPerson,{person,title:'PI',en:true}))
        assert.ok(html.includes('href="/en/scheda-personale/?person_id=person"'))
        assert.ok(html.includes('fa-id-card') && html.includes('Example Name'))
        assert.ok(!html.includes('Hidden institution'))
    }
    const person = {_id:'external',firstName:'External',lastName:'Name',hasPersonProfile:false,
        affiliations:[{name:'External university'},{name:'External university'},{}]}
    const html = renderToStaticMarkup(React.createElement(KeyPerson,{person,title:'PI',en:true}))
    assert.ok(html.includes('External university'))
    assert.equal((html.match(/External university/g) || []).length,1)
    assert.ok(!html.includes('href=') && !html.includes('()'))
})

test('detail contacts handle missing PI, duplicate coordinator and absent optional data', () => {
    const row = grant()
    row.localCoordinator = row.pi
    queryResult = {data:row}
    assert.equal((renderDetail({en:true}).match(/dm-grant-contact-name/g) || []).length,1)
    row.pi = null
    assert.ok(renderDetail({en:true}).includes('Local Coordinator'))
    queryResult = {data:{name:'Minimal project'}}
    const html = renderDetail({en:true})
    assert.ok(html.includes('Minimal project'))
    for (const absent of ['<dl','<section','undefined','Invalid Date','c-accordion__title']) assert.ok(!html.includes(absent),absent)
})

test('detail labels and open-ended dates are localized without displaying invalid dates', () => {
    document.documentElement.lang = 'it-IT'
    queryResult = {data:{...grant(),endDate:null,description:'Descrizione'}}
    let html = renderDetail({})
    for (const text of ['Periodo del progetto','Dal 15 gennaio 2025','Coordinatore locale','Descrizione']) assert.ok(html.includes(text),text)
    queryResult = {data:{...grant(),startDate:null}}
    html = renderDetail({en:true})
    assert.ok(html.includes('Until December 20, 2026'))
    queryResult = {data:{...grant(),startDate:'invalid',endDate:null}}
    assert.ok(!renderDetail({en:true}).includes('Project period'))
})
