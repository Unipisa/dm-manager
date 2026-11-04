const assert = require('node:assert/strict')
const { test } = require('node:test')
const migrateSSDs = require('../migrations/ssd-math-codes')
const { Schema, model, SSD, multipleSSDs } = require('../models/Model')

const oldCodes = Array.from({ length: 9 }, (_, i) => `MAT/0${i + 1}`)
const newCodes = [
    'MATH-01/A', 'MATH-02/A', 'MATH-02/B', 'MATH-01/B', 'MATH-03/A',
    'MATH-03/B', 'MATH-04/A', 'MATH-05/A', 'MATH-06/A',
]

// Evaluate only the MongoDB expression operators used here, entirely in memory.
// No server startup, credentials or database connection.
function evaluate(expression, scope) {
    if (typeof expression === 'string' && expression.startsWith('$')) return scope[expression]
    if (!expression || typeof expression !== 'object') return expression
    if (expression.$eq) return evaluate(expression.$eq[0], scope) === evaluate(expression.$eq[1], scope)
    if (expression.$isArray) return Array.isArray(evaluate(expression.$isArray, scope))
    if (expression.$cond) {
        const condition = expression.$cond
        return evaluate(evaluate(condition.if, scope) ? condition.then : condition.else, scope)
    }
    if (expression.$map) {
        const map = expression.$map
        return evaluate(map.input, scope).map(value => evaluate(map.in, { ...scope, [`$$${map.as}`]: value }))
    }
    if (expression.$switch) {
        const branch = expression.$switch.branches.find(branch => evaluate(branch.case, scope))
        return evaluate(branch ? branch.then : expression.$switch.default, scope)
    }
    throw new Error(`Unexpected expression: ${JSON.stringify(expression)}`)
}

test('migration converts all nine codes across every SSD collection and is safe to rerun', async () => {
    const originals = [
        ...oldCodes.map(SSD => ({ SSD })),
        { SSD: [...oldCodes] },
        { SSD: ['MAT/04', 'MATH-02/B', 'unknown', '', null] },
        { SSD: 'MATH-06/A' }, { SSD: 'unknown' }, { SSD: '' }, { SSD: null }, { SSD: [] }, {},
    ]
    const collections = Object.fromEntries(
        ['staffs', 'grants', 'eventconferences', 'visits', 'theses']
            .map(name => [name, structuredClone(originals)])
    )
    const db = { collection(name) {
        assert.ok(collections[name], `Unexpected collection: ${name}`)
        return { async updateMany(filter, pipeline) {
            assert.deepEqual(filter, { SSD: { $in: oldCodes } })
            assert.equal(pipeline.length, 1)
            assert.deepEqual(Object.keys(pipeline[0].$set), ['SSD'])
            for (const doc of collections[name]) {
                const values = Array.isArray(doc.SSD) ? doc.SSD : [doc.SSD]
                if (values.some(value => filter.SSD.$in.includes(value))) {
                    doc.SSD = evaluate(pipeline[0].$set.SSD, { $SSD: doc.SSD })
                }
            }
        } }
    } }

    assert.equal(await migrateSSDs(db), true)
    const expected = [
        ...newCodes.map(SSD => ({ SSD })),
        { SSD: newCodes },
        { SSD: ['MATH-01/B', 'MATH-02/B', 'unknown', '', null] },
        ...originals.slice(11),
    ]
    for (const documents of Object.values(collections)) assert.deepEqual(documents, expected)
    const converted = structuredClone(collections)
    assert.equal(await migrateSSDs(db), true)
    assert.deepEqual(collections, converted)
})

test('shared scalar and array schemas accept new codes, reject old codes and retain defaults', () => {
    const Check = model('SSDValidationCheck', new Schema({ single: SSD, multiple: multipleSSDs }))
    for (const code of newCodes) {
        assert.equal(new Check({ single: code, multiple: [code] }).validateSync(), undefined)
    }
    for (const code of oldCodes) {
        const error = new Check({ single: code, multiple: [code] }).validateSync()
        assert.ok(error.errors.single)
        assert.ok(error.errors['multiple.0'])
    }
    const empty = new Check()
    assert.equal(empty.single, '')
    assert.deepEqual([...empty.multiple], [])
    assert.deepEqual(Check._schema_info.properties.single.enum, [...newCodes, ''])
    assert.deepEqual(Check._schema_info.properties.multiple.enum, newCodes)
})
