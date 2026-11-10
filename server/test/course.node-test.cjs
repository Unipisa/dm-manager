const assert = require('node:assert/strict')
const {test} = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const {createRequire} = require('node:module')

// No credentials or database connection: all aggregates and HTTP calls are mocked.
const configPath = require.resolve('../config')
require.cache[configPath] = {id:configPath,filename:configPath,loaded:true,exports:{BASE_URL:'http://localhost:3000',API_PATH:'/api/v0'}}
const Model = require('../models/EventPhdCourse')
const courseQuery = require('../controllers/public/course')
const coursesQuery = require('../controllers/public/courses')
const widgetRequire = createRequire(path.resolve(__dirname,'../../widgets/package.json'))
const {transformSync} = widgetRequire('esbuild')
const React = widgetRequire('react')
const {renderToStaticMarkup} = widgetRequire('react-dom/server')
const window = {location:{search:''}}
const document = {documentElement:{lang:'it-IT'},cookie:''}
let queryResult, fetchData, queryKey, requestedUrl, responseData
const modules = new Map()
function loadWidget(file) {
    if (modules.has(file)) return modules.get(file).exports
    const module = {exports:{}}
    modules.set(file,module)
    vm.runInNewContext(transformSync(fs.readFileSync(file,'utf8'),{loader:'jsx',format:'cjs'}).code,{
        module,exports:module.exports,window,document,URLSearchParams,dmwidgets:{localDevelopment:true},
        require(name) {
            if (name.endsWith('.css')) return {}
            if (name === 'react-query') return {useQuery(key,fn) {queryKey=key;fetchData=fn;return queryResult}}
            if (name === 'axios') return {get:async url => {requestedUrl=url;return {data:{data:responseData}}}}
            if (name.startsWith('.')) return loadWidget(path.resolve(path.dirname(file),name+'.js'))
            return widgetRequire(name)
        },
    },{filename:file})
    return module.exports
}
const {Course} = loadWidget(path.resolve(__dirname,'../../widgets/src/components/Course.js'))
const render = props => renderToStaticMarkup(React.createElement(Course,props))
const id = '641b8b0b840928dc5b8da2e3'
const otherId = '641b8b0b840928dc5b8da2e4'
const response = () => ({statusCode:200,status(code){this.statusCode=code;return this},send(body){this.body=body;return this}})
const course = () => ({_id:id,title:'Course title',courseType:'Thematic',phd:'HPSC',startDate:'2026-01-01',endDate:'2026-12-31',description:'A **description** with $x^2$.',
    lecturers:[
        {_id:'internal',firstName:'Internal',lastName:'Lecturer',hasPersonProfile:true,email:'internal@example.org',affiliations:[{_id:'641b8b0b840928dc5b8da2e3',name:'Università di Pisa'}]},
        {_id:'external',firstName:'External',lastName:'Lecturer',hasPersonProfile:false,personalPage:'https://example.org/person',affiliations:[{_id:'external-university',name:'External university'}]},
    ],lessons:[
        {date:'2026-07-15T08:00:00Z',duration:90,conferenceRoom:'Room A',conferenceRoomID:'room'},
        {date:'2026-01-15T08:00:00Z',duration:60,conferenceRoom:'Room B'},
    ]})

test('public course selects one ID and reuses approved lecturer/lesson fields',async t => {
    let pipeline
    t.mock.method(Model,'aggregate',async stages => {pipeline=stages;return [course()]})
    const res=response()
    await courseQuery({params:{id},query:{from:'2099-01-01'}},res)
    assert.equal(res.statusCode,200)
    assert.equal(res.body.data[0].title,'Course title')
    assert.equal(pipeline[0].$match._id.toString(),id)
    assert.equal(pipeline[0].$match.endDate,undefined)
    const projection=pipeline.at(-1).$project
    assert.equal(projection.description,1)
    assert.equal(projection.lessons,1)
    assert.equal(projection.createdBy,undefined)
    const lecturers=pipeline.find(stage => stage.$lookup?.as === 'lecturers').$lookup.pipeline
    assert.ok(lecturers.some(stage => stage.$set?.hasPersonProfile))
    assert.equal(lecturers.at(-1).$project.email,1)
    assert.equal(lecturers.at(-1).$project.personalPage,1)
    assert.equal(lecturers.at(-1).$project.notes,undefined)
    const lessonGroup=pipeline.find(stage => stage.$group).$group.lessons.$push
    assert.equal(lessonGroup.conferenceRoom,'$conferenceRoom.name')
    assert.equal(lessonGroup.conferenceRoomID,'$conferenceRoom.room')
    assert.equal(lessonGroup.mrbsBookingID,undefined)
})

test('invalid course IDs return 400 without querying, and missing courses return 404',async t => {
    const aggregate=t.mock.method(Model,'aggregate',async () => [])
    for (const invalid of [undefined,'bad-id']) {
        const res=response()
        await courseQuery({params:{id:invalid}},res)
        assert.equal(res.statusCode,400)
    }
    assert.equal(aggregate.mock.calls.length,0)
    const res=response()
    await courseQuery({params:{id}},res)
    assert.equal(res.statusCode,404)
})

test('the existing course catalogue retains date and programme filters',async t => {
    let pipeline
    t.mock.method(Model,'aggregate',async stages => {pipeline=stages;return []})
    await coursesQuery({query:{from:'2025-09-01',to:'2026-09-01',phd:'HPSC'}})
    assert.equal(pipeline[0].$match._id,undefined)
    assert.equal(pipeline[0].$match.phd,'HPSC')
    assert.equal(pipeline[0].$match.endDate.$gte.toISOString(),'2025-09-01T00:00:00.000Z')
})

test('Course supports page-query IDs and explicit props take precedence',async () => {
    queryResult={data:course()}
    window.location.search=`?phd_course_id=${id}`
    assert.ok(render({en:true}).includes('Course title'))
    assert.equal(queryKey[1],id)
    render({phd_course_id:otherId,en:true})
    assert.equal(queryKey[1],otherId)
    responseData=[course()]
    await fetchData()
    assert.equal(requestedUrl,`/api/v0/public/course/${otherId}`)
    window.location.search=''
    for (const props of [{},{phd_course_id:'invalid'}]) {
        fetchData=null
        assert.ok(render({...props,en:true}).includes('role="alert"'))
        assert.equal(fetchData,null)
    }
})

test('Course displays project facts, lecturer cards, chronological lessons and a visible description', () => {
    const data=course()
    const originalOrder=data.lessons.map(lesson => lesson.date)
    queryResult={data}
    const html=render({phd_course_id:id,en:true})
    for (const text of ['Course title','Thematic','Lecturers','dm-people-cards','Internal Lecturer','External Lecturer',
        '/en/scheda-personale/?person_id=internal','mailto:internal@example.org','https://example.org/person','External university',
        'Description','Start date','End date','January 1, 2026','December 31, 2026','<strong>description</strong>','katex','Scheduled lessons','Room A','Room B',
        '/map?sel=room','target="_blank"','09:00','10:00','60 minutes','90 minutes']) assert.ok(html.includes(text),text)
    assert.ok(html.includes('Università di Pisa'))
    assert.ok(!html.includes('PhD programme') && !html.includes('Dottorato'))
    assert.ok(!html.includes('c-accordion__title'))
    assert.ok(html.indexOf('>Scheduled lessons</h3>') < html.indexOf('>Description</h3>'))
    assert.equal((html.match(/<article class="dm-person-card">/g) || []).length,2)
    assert.ok(html.indexOf('09:00') < html.indexOf('10:00'))
    assert.deepEqual(data.lessons.map(lesson => lesson.date),originalOrder)
})

test('empty and placeholder lessons do not produce invalid dates or empty room icons', () => {
    queryResult={data:{title:'Minimal course',lecturers:[],lessons:[{},null,{date:'invalid'}]}}
    let html=render({phd_course_id:id,en:true})
    assert.ok(html.includes('No lessons scheduled yet.'))
    assert.ok(!html.includes('Invalid Date') && !html.includes('fa-door-open') && !html.includes('dm-person-card'))
    queryResult={data:{title:'Minimal course',lessons:[{date:'2026-01-15T08:00:00Z',duration:60}]}}
    html=render({phd_course_id:id})
    assert.ok(html.includes('Lezioni in programma') && html.includes('minuti'))
    assert.ok(!html.includes('fa-door-open'))
})

test('loading, request errors and an empty API result follow the widget conventions',async () => {
    queryResult={isLoading:true}
    assert.ok(render({phd_course_id:id}).includes('Caricamento'))
    queryResult={error:new Error('Mock error')}
    assert.ok(render({phd_course_id:id}).includes('Mock error'))
    queryResult={data:course()}
    render({phd_course_id:id,en:true})
    responseData=[]
    await assert.rejects(fetchData,/Course not found/)
})


test('course facts omit missing/invalid dates and localize an available boundary', () => {
    queryResult={data:{title:'Course',startDate:'invalid',endDate:'2026-12-31',lessons:[]}}
    const html=render({phd_course_id:id})
    assert.ok(html.includes('Data di fine') && html.includes('31 dicembre 2026'))
    assert.ok(!html.includes('Data di inizio') && !html.includes('Invalid Date'))
    queryResult={data:{title:'Course',lessons:[]}}
    assert.ok(!render({phd_course_id:id}).includes('dm-course-facts'))
})


test('course lecturer cards use the usual affiliations and omit email only when no address is available', () => {
    const data=course()
    data.lecturers[0].email=''
    queryResult={data}
    const html=render({phd_course_id:id,en:true})
    assert.ok(html.includes('Università di Pisa') && html.includes('External university'))
    assert.ok(!html.includes('mailto:') && !html.includes('dm-person-card-contact'))
})
