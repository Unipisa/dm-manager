const assert = require('node:assert/strict')
const {test} = require('node:test')
const {Mongoose} = require('mongoose')

test('countDocuments applies sanitizeFilter before sending filters to MongoDB', async () => {
    const mongoose = new Mongoose()
    const Model = mongoose.model('SanitizeFilterRegression', new mongoose.Schema({name: String}))
    const filters = []
    Model.collection.countDocuments = async filter => {
        filters.push(filter)
        return 1
    }

    assert.equal(await Model.countDocuments({name: 'Alice'}).setOptions({sanitizeFilter: true}), 1)
    assert.deepEqual(filters, [{name: 'Alice'}])
    await assert.rejects(
        Model.countDocuments({name: {$ne: null}}).setOptions({sanitizeFilter: true}).exec(),
        {name: 'CastError', path: 'name'},
    )
    assert.equal(filters.length, 1, 'The injected operator must not reach MongoDB')
})
