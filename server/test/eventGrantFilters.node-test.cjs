const assert = require('node:assert/strict')
const {test} = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const {createRequire} = require('node:module')

// All aggregates and HTTP calls are mocked; no credentials or database connections.
const configPath = require.resolve('../config')
require.cache[configPath] = {id:configPath,filename:configPath,loaded:true,exports:{BASE_URL:'http://localhost:3000',API_PATH:'/api/v0'}}
const EventSeminar = require('../models/EventSeminar')
const seminarsQuery = require('../controllers/public/seminars')
const widgetRequire = createRequire(path.resolve(__dirname,'../../widgets/package.json'))
const {transformSync} = widgetRequire('esbuild')
const grantId = '641b8b0b840928dc5b8da2e3'

function widget(name) {
    let fetchData, queryKey
    const requests = []
    const module = {exports:{}}
    const file = path.resolve(__dirname,`../../widgets/src/components/${name}.js`)
    vm.runInNewContext(transformSync(fs.readFileSync(file,'utf8'),{loader:'jsx',format:'cjs'}).code,{
        module,exports:module.exports,
        require(name) {
            if (name === 'react-query') return {useQuery(key,fn) {queryKey=key;fetchData=fn;return {data:[]}}}
            if (name === 'axios') return {get:async (url,options) => {requests.push({url,params:options.params});return {data:{data:[]}}}}
            if (name === '../utils') return {getManageURL:route => '/api/v0/'+route,isEnglish:value => !!value}
            if (name.startsWith('.')) return {Loading:()=>null,EventListContent:()=>null,YearGroupedContent:()=>null}
            return widgetRequire(name)
        },
    },{filename:file})
    return {Component:module.exports[name],requests,fetch:()=>fetchData(),key:()=>queryKey}
}

test('the seminar API matches the grants array before sorting and limiting',async t => {
    let pipeline
    t.mock.method(EventSeminar,'aggregate',async stages => {pipeline=stages;return []})
    await seminarsQuery({query:{grants:grantId,from:'2026-01-01',_sort:'startDatetime',_limit:'5'}})
    assert.equal(pipeline[0].$match.grants.toString(),grantId)
    assert.equal(pipeline[0].$match.grant,undefined)
    assert.equal(pipeline[0].$match.startDatetime.$gte.toISOString(),'2026-01-01T00:00:00.000Z')
    assert.ok(pipeline.findIndex(stage => stage.$limit) > 0)
    await seminarsQuery({query:{}})
    assert.equal(pipeline[0].$match.grants,undefined)
})

test('SeminarList forwards grants and includes it in the cache key',async () => {
    const seminar=widget('SeminarList')
    seminar.Component({grants:grantId,group_by_year:true})
    await seminar.fetch()
    assert.equal(seminar.requests[0].url,'/api/v0/public/seminars')
    assert.equal(seminar.requests[0].params.grants,grantId)
    assert.equal(seminar.requests[0].params.grant,undefined)
    assert.equal(seminar.requests[0].params.group_by_year,undefined)
    assert.equal(seminar.key()[1].grants,grantId)
})

test('EventList applies the same grants filter to both event endpoints',async () => {
    const events=widget('EventList')
    events.Component({grants:grantId})
    await events.fetch()
    assert.equal(events.requests.length,2)
    for (const request of events.requests) {
        assert.equal(request.params.grants,grantId)
        assert.equal(request.params.grant,undefined)
    }
})
