const assert = require('node:assert/strict')
const {test} = require('node:test')

// No credentials or database connection. Capture aggregates and evaluate their
// date-match/sort/selection stages against synthetic assignment fixtures.
const configPath = require.resolve('../config')
require.cache[configPath] = {id:configPath,filename:configPath,loaded:true,exports:{BASE_URL:'http://localhost:3000',API_PATH:'/api/v0'}}
const Staff = require('../models/Staff')
const staffListQuery = require('../controllers/public/staff-list')
const {personRoomAssignmentPipeline,personPeriodRoomAssignmentPipeline} = require('../models/RoomAssignment')

const now = new Date('2026-11-17T12:00:00Z')
const date = value => value ? new Date(value) : null
const assignment = (_id,start,end) => ({_id,startDate:date(start),endDate:date(end),room:{_id:'room-'+_id}})

// Small evaluator for the Mongo expressions used by the captured selector.
function evaluate(expr,row,variables) {
    if (typeof expr === 'string' && expr.startsWith('$')) {
        const source = expr.startsWith('$$') ? variables : row
        const fields = expr.slice(expr.startsWith('$$') ? 2 : 1).split('.')
        return fields.reduce((value,field) => value?.[field],source)
    }
    if (!expr || typeof expr !== 'object' || expr instanceof Date) return expr
    if (Array.isArray(expr)) return expr.map(item => evaluate(item,row,variables))
    if (expr.$let) {
        const scope={...variables}
        for (const [key,value] of Object.entries(expr.$let.vars)) scope[key]=evaluate(value,row,variables)
        return evaluate(expr.$let.in,row,scope)
    }
    if (expr.$switch) {
        const branch=expr.$switch.branches.find(branch => evaluate(branch.case,row,variables))
        return evaluate(branch ? branch.then : expr.$switch.default,row,variables)
    }
    if (expr.$filter) {
        return evaluate(expr.$filter.input,row,variables).filter(value =>
            evaluate(expr.$filter.cond,row,{...variables,[expr.$filter.as]:value}))
    }
    const [[operator,args]] = Object.entries(expr)
    const values = args.map(arg => evaluate(arg,row,variables))
    switch (operator) {
        case '$and': return values.every(Boolean)
        case '$or': return values.some(Boolean)
        case '$eq': return values[0] === values[1]
        case '$ne': return values[0] !== values[1]
        case '$gt': return values[0] > values[1]
        case '$lt': return values[0] < values[1]
        case '$lte': return values[0] <= values[1]
        case '$gte': return values[0] >= values[1]
        case '$ifNull': return values[0] ?? values[1]
        case '$arrayElemAt': return values[0].at(values[1])
        default: throw new Error('Unexpected expression '+operator)
    }
}

async function selector(t) {
    let pipeline
    t.mock.method(Staff,'aggregate',async stages => {pipeline=stages;return []})
    const res={send(){},status(){return this}}
    await staffListQuery({query:{}},res)
    return selectionFromPipeline(pipeline)
}

function selectionFromPipeline(pipeline) {
    const lookup=pipeline.find(stage => stage.$lookup?.as === 'roomAssignments').$lookup
    const match=lookup.pipeline.find(stage => stage.$match).$match.$expr
    const sort=lookup.pipeline.find(stage => stage.$sort).$sort
    const selection=pipeline.find(stage => stage.$addFields?.roomAssignment).$addFields.roomAssignment
    return (rows,record={startDate:date('2010-01-01'),endDate:null}) => {
        const variables={NOW:now}
        for (const [name,value] of Object.entries(lookup.let)) variables[name]=evaluate(value,record,variables)
        const matches=rows.filter(row => evaluate(match,row,variables)).sort((a,b) => {
            for (const [field,direction] of Object.entries(sort)) {
                if (a[field] < b[field]) return -direction
                if (a[field] > b[field]) return direction
            }
            return 0
        })
        const result={...record,roomAssignments:matches}
        result.roomAssignment=evaluate(selection,result,variables)
        return result
    }
}

test('StaffList selects the current open-ended room over expired or future assignments',async t => {
    const select=await selector(t)
    const current=assignment('current','2025-01-01',null)
    const rows=[assignment('expired','2020-01-01','2024-12-31'),current,assignment('future','2027-01-01',null)]
    assert.equal(select(rows).roomAssignment,current)
    assert.deepEqual(rows.map(row => row._id),['expired','current','future'])
})

test('among overlapping active rooms StaffList chooses the latest start date',async t => {
    const select=await selector(t)
    const latest=assignment('latest','2026-09-01','2027-01-01')
    assert.equal(select([latest,assignment('older','2020-01-01',null),assignment('open-start',null,null)]).roomAssignment,latest)
})

test('no active assignment produces no office; active date boundaries are inclusive',async t => {
    const select=await selector(t)
    assert.equal(select([assignment('expired','2020-01-01','2025-01-01'),assignment('future','2027-01-01',null)]).roomAssignment,null)
    assert.equal(select([]).roomAssignment,null)
    const boundary=assignment('boundary',now.toISOString(),now.toISOString())
    assert.equal(select([boundary]).roomAssignment,boundary)
})

test('equal start dates have a deterministic tie break without changing historical default selection',async t => {
    const select=await selector(t)
    const first=assignment('000000000000000000000001','2026-01-01',null)
    const second=assignment('000000000000000000000002','2026-01-01',null)
    assert.equal(select([second,first]).roomAssignment,second)
    const historical=personRoomAssignmentPipeline()[0].$lookup
    assert.deepEqual(historical.let,{start:'$startDate',end:'$endDate'})
    assert.deepEqual(historical.pipeline.find(stage => stage.$sort).$sort,{endDate:1})
})


const period = (start,end) => ({startDate:date(start),endDate:date(end)})

test('future records use the room at the start, excluding moves later in the visit', () => {
    const select=selectionFromPipeline(personPeriodRoomAssignmentPipeline())
    const first=assignment('first','2027-01-01','2027-01-15')
    const later=assignment('later','2027-01-16','2027-02-01')
    const result=select([later,first,assignment('old','2026-01-01','2026-02-01')],period('2027-01-01','2027-02-01'))
    assert.equal(result.roomAssignment,first)
    assert.deepEqual(result.roomAssignments,[first,later])
})

test('past records use the room at the end and retain every assignment during the period', () => {
    const select=selectionFromPipeline(personPeriodRoomAssignmentPipeline())
    const first=assignment('first','2024-01-01','2024-01-15')
    const last=assignment('last','2024-01-16','2024-02-01')
    const result=select([last,assignment('current','2026-01-01',null),first],period('2024-01-01','2024-02-01'))
    assert.equal(result.roomAssignment,last)
    assert.deepEqual(result.roomAssignments,[first,last])
})

test('ongoing visits choose the room active now while retaining past and planned moves', () => {
    const select=selectionFromPipeline(personPeriodRoomAssignmentPipeline())
    const first=assignment('first','2026-10-01','2026-10-31')
    const current=assignment('current','2026-11-01','2026-11-30')
    const planned=assignment('planned','2026-12-01','2026-12-31')
    const result=select([planned,first,current],period('2026-10-01','2026-12-31'))
    assert.equal(result.roomAssignment,current)
    assert.deepEqual(result.roomAssignments,[first,current,planned])
})

test('fully undated and one-sided record/assignment periods remain supported', () => {
    const select=selectionFromPipeline(personPeriodRoomAssignmentPipeline())
    const undated=assignment('undated',null,null)
    assert.equal(select([undated],period(null,null)).roomAssignment,undated)
    const future=assignment('future','2027-01-01',null)
    assert.equal(select([undated,future],period('2027-01-01',null)).roomAssignment,future)
    const past=assignment('past','2023-01-01','2024-01-01')
    assert.equal(select([undated,past],period(null,'2024-01-01')).roomAssignment,past)
})

test('no room at the reference date stays empty even when the period has other assignments', () => {
    const select=selectionFromPipeline(personPeriodRoomAssignmentPipeline())
    const later=assignment('later','2027-01-15','2027-02-01')
    const result=select([later],period('2027-01-01','2027-02-01'))
    assert.equal(result.roomAssignment,null)
    assert.deepEqual(result.roomAssignments,[later])
})

test('staff and visit management list/detail pipelines share the same selection policy', () => {
    const StaffController=require('../controllers/StaffController')
    const VisitController=require('../controllers/VisitController')
    const staff=new StaffController()
    const visit=new VisitController()
    const expected=personPeriodRoomAssignmentPipeline()
    for (const pipeline of [staff.queryPipeline,visit.queryPipeline,visit.indexPipeline]) {
        assert.deepEqual(pipeline.find(stage => stage.$lookup?.as === 'roomAssignments'),expected[0])
        assert.deepEqual(pipeline.find(stage => stage.$addFields?.roomAssignment),expected[1])
    }
})

test('both public visit endpoints use the policy for current, future and past records',async t => {
    const Visit=require('../models/Visit')
    const visitListQuery=require('../controllers/public/visit-list')
    const visitsQuery=require('../controllers/public/visits')
    let pipeline
    t.mock.method(Visit,'aggregate',async stages => {pipeline=stages;return []})
    const expected=personPeriodRoomAssignmentPipeline()[1]
    await visitListQuery({query:{}},{status(){return this},send(){}})
    assert.deepEqual(pipeline.find(stage => stage.$addFields?.roomAssignment),expected)
    for (const query of [{},{future:'true'},{from:'2020-01-01',to:'2021-01-01'}]) {
        await visitsQuery({query})
        assert.deepEqual(pipeline.find(stage => stage.$addFields?.roomAssignment),expected)
    }
})
