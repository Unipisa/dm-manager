const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')

// No credentials, server startup or database access. Backend aggregates and HTTP are mocked.
const configPath = require.resolve('../config')
require.cache[configPath] = { id: configPath, filename: configPath, loaded: true, exports: { BASE_URL: 'http://localhost:3000', API_PATH: '/api/v0' } }
const { personProfilePipeline } = require('../controllers/public/person-profile')
const widgetRequire = createRequire(path.resolve(__dirname, '../../widgets/package.json'))
const { transformSync } = widgetRequire('esbuild')
const React = widgetRequire('react')
const { renderToStaticMarkup } = widgetRequire('react-dom/server')
const document = { documentElement: { lang: 'it' }, cookie: '' }
let queryData
const modules = new Map()
function loadWidget(file) {
    if (modules.has(file)) return modules.get(file).exports
    const module = { exports: {} }
    modules.set(file, module)
    vm.runInNewContext(transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs' }).code, {
        module, exports: module.exports, document, URLSearchParams,
        require(name) {
            if (name.endsWith('.css')) return {}
            if (name === 'react-query') return { useQuery: () => ({ data: queryData }) }
            if (name === 'axios') return { get: () => assert.fail('Unexpected HTTP request') }
            if (name.startsWith('.')) return loadWidget(path.resolve(path.dirname(file), name + '.js'))
            return widgetRequire(name)
        },
    }, { filename: file })
    return module.exports
}
const widget = (file, name) => loadWidget(path.resolve(__dirname, '../../widgets/src/components/' + file + '.js'))[name]
const { hasPersonProfile, getPersonProfileURL } = loadWidget(path.resolve(__dirname, '../../widgets/src/person-profile.js'))
const { getPeopleTableOptions } = loadWidget(path.resolve(__dirname, '../../widgets/src/components/PeopleTable.js'))

const cases = [
    [{}, false],
    [{ staffs: [] }, false],
    [{ staffs: [{ isInternal: false, qualification: 'Docente Esterno' }] }, false],
    [{ staffs: [{ isInternal: false }, { isInternal: true }] }, true],
    [{ staffs: [{ isInternal: true }, { isInternal: false }] }, true],
    [{ staffs: [{ isInternal: false, qualification: 'ex Docente' }] }, true],
    [{ staff: [{ isInternal: false, qualification: 'ex Docente' }] }, true],
    [{ staff: { isInternal: true } }, true],
    [{ hasPersonProfile: true }, true],
    [{ hasPersonProfile: false, staffs: [{ isInternal: true }] }, false],
]

test('one profile rule handles every staff entry, former faculty and authoritative API flags', () => {
    for (const [data, expected] of cases) {
        const person = { _id: 'person', ...data }
        assert.equal(hasPersonProfile(person), expected, JSON.stringify(data))
        assert.equal(getPersonProfileURL(person, false), expected ? '/scheda-personale/?person_id=person' : null)
        assert.equal(getPersonProfileURL(person, true), expected ? '/en/scheda-personale/?person_id=person' : null)
    }
    assert.equal(getPersonProfileURL({ staffs: [{ isInternal: true }] }), null)
    assert.equal(getPersonProfileURL({ _id: 'staff' }, false, [{qualification: 'ex Docente'}]), '/scheda-personale/?person_id=staff')
})

test('the backend derives the same rule from all qualifications without exposing staff details', () => {
    const pipeline = personProfilePipeline()
    assert.deepEqual(pipeline[0].$lookup.pipeline[0].$match, { $or: [{isInternal: true}, {qualification: 'ex Docente'}] })
    assert.equal(pipeline[0].$lookup.localField, '_id')
    assert.equal(pipeline[0].$lookup.foreignField, 'person')
    assert.deepEqual(pipeline[0].$lookup.pipeline.at(-1).$project, {_id: 1})
    assert.equal(pipeline.at(-1).$unset, '_profileStaff')
    assert.ok(!JSON.stringify(pipeline).includes('startDate') && !JSON.stringify(pipeline).includes('endDate'))
})

function walk(value) {
    if (!value || typeof value !== 'object') return []
    return [value, ...Object.values(value).flatMap(walk)]
}
for (const [endpoint, model, count] of [
    ['person', 'Person', 1], ['group', 'Group', 3], ['courses', 'EventPhdCourse', 1],
    ['staff-list', 'Staff', 1], ['visit-list', 'Visit', 1], ['grant', 'Grant', 3],
    ['grants', 'Grant', 2], ['theses', 'Thesis', 2],
]) {
    test(`public/${endpoint} provides profile eligibility wherever it returns people`, async t => {
        const Model = require('../models/' + model)
        const controller = require('../controllers/public/' + endpoint)
        let pipeline
        t.mock.method(Model, 'aggregate', async stages => { pipeline = stages; return [] })
        const res = { status() { return this }, send() {}, json() {} }
        await controller({params: {id: '0123456789abcdef01234567'}, query: {}}, res)
        const lookups = walk(pipeline).filter(stage => stage.$lookup?.as === '_profileStaff')
        assert.equal(lookups.length, count)
        assert.ok(walk(pipeline).some(stage => stage.$project?.hasPersonProfile === 1
            || stage.$project?.person?.hasPersonProfile === 1 || stage.$project?.pi?.hasPersonProfile === 1))
    })
}

test('all widgets use the same eligibility rule for profile links', () => {
    for (const [data, expected] of cases) {
        const person = {
            _id: 'person', firstName: 'Example', lastName: 'Person', affiliations: [],
            ...data,
        }
        const displays = [
            ['PersonCard', 'PersonCardContent', {person}, undefined],
            ['GroupCards', 'GroupCards', {group_id: 'group'}, {members: [person]}],
            ['PeopleTable', 'PeopleTable', {data: [{person}], ...getPeopleTableOptions({columns:'name'}), en:false}, undefined],
            ['PeopleTable', 'PeopleTable', {data: [{person}], ...getPeopleTableOptions({columns:'name'}, 'visit'), en:false}, undefined],
            ['Grant', 'KeyPerson', {person, title:'PI'}, undefined],
            ['GrantList', 'GrantList', {}, [{_id:'grant',name:'Grant',pi:person,startDate:'2026-01-01',endDate:'2026-12-31'}]],
            ['ThesisList', 'ThesisList', {group_by_year:true,columns:'advisors'}, [{_id:'thesis',date:'2026-01-01',advisors:[person]}]],
            ['ThesisList', 'ThesisList', {}, [{_id:'thesis',title:'Thesis',date:'2026-01-01',person:{firstName:'Student',lastName:'Example'},advisors:[person],institutions:[]}]],
            ['CourseList', 'CourseList', {from:'2025-09-01',to:'2026-09-01'}, [{_id:'course',title:'Course',startDate:'2026-01-01',endDate:'2026-12-31',lecturers:[person],lessons:[]}]],
        ]
        for (const [file, name, props, result] of displays) {
            queryData = result
            const html = renderToStaticMarkup(React.createElement(widget(file, name), props))
            assert.equal(html.includes('/scheda-personale/?person_id=person'), expected, `${file}: ${JSON.stringify(data)}`)
            assert.ok(!html.includes('/person-details/'))
        }
    }
})

test('ineligible cards retain external personal-page links; former faculty use the department profile', () => {
    const Component = widget('PersonCard', 'PersonCardContent')
    const person = {_id:'person',firstName:'Example',lastName:'Person',personalPage:'https://example.org',staffs:[]}
    let html = renderToStaticMarkup(React.createElement(Component, {person}))
    assert.ok(html.includes('href="https://example.org" target="_blank"'))
    html = renderToStaticMarkup(React.createElement(Component, {person:{...person,staffs:[{qualification:'ex Docente',isInternal:false}]}}))
    assert.ok(html.includes('href="/scheda-personale/?person_id=person"'))
    assert.ok(!html.includes('target="_blank"'))
})

test('course badges precede titles and section headings have no trailing colons', () => {
    const course = {_id:'course',title:'Example course',courseType:'PhD',startDate:'2026-01-01',endDate:'2026-02-01',
        lecturers:[],lessons:[{date:'2026-01-10T10:00:00Z',duration:60}],description:'Course description'}
    queryData = [course]
    const html = renderToStaticMarkup(React.createElement(widget('CourseList','CourseList'), {from:'2025-09-01',to:'2026-09-01'}))
    assert.ok(html.indexOf('>PhD</span>') < html.indexOf('>Example course</span>'))
    for (const label of ['Lecturers','Scheduled lessons','Period','Description']) {
        assert.ok(html.includes(`dm-course-section-title">${label}</h5>`),label)
    }
})

test('list excerpts hide embedded flyers while individual event pages retain them', () => {
    const {EventDescription} = loadWidget(path.resolve(__dirname,'../../widgets/src/components/EventContent.js'))
    const description = 'Event description. ![Flyer](https://example.org/flyer.png)'
    const list = renderToStaticMarkup(React.createElement(EventDescription,{excerpt:true},description))
    assert.ok(list.includes('Event description') && !list.includes('<img'))
    const detail = renderToStaticMarkup(React.createElement(EventDescription,{},description))
    assert.ok(detail.includes('<img') && detail.includes('https://example.org/flyer.png'))
})


test('seminar and conference lists support optional start-year accordions', () => {
    for (const [component,dateField,type] of [['SeminarList','startDatetime','seminar'],['ConferenceList','startDate','conference']]) {
        const base = {title:'Example event',startDatetime:'2024-01-01T10:00:00Z',duration:60,
            startDate:'2024-01-01',endDate:'2026-01-01',description:'Description',abstract:'Abstract'}
        queryData = [
            {...base,_id:'old',[dateField]:'2024-01-01'},
            {...base,_id:'new',[dateField]:'2026-01-01'},
            {...base,_id:'missing',[dateField]:null},
            {...base,_id:'invalid',[dateField]:'invalid'},
        ]
        const render = props => renderToStaticMarkup(React.createElement(widget(component,component),props))
        const html = render({group_by_year:'true',en:true})
        assert.equal((html.match(/class="dm-event-list"/g) || []).length,3,component)
        assert.ok(html.indexOf('>2026<') < html.indexOf('>2024<'),component)
        assert.ok(html.indexOf('>2024<') < html.indexOf('>Undated<'),component)
        assert.equal((html.match(/Example event/g) || []).length,4,component)
        for (const flag of [undefined,false,'false','0']) assert.ok(!render({group_by_year:flag}).includes('c-accordion__title'),component)
        assert.ok(render({group_by_year:'yes'}).includes('role="alert"'))
        queryData = []
        assert.ok(!render({group_by_year:true}).includes('c-accordion__title'))
    }
})
