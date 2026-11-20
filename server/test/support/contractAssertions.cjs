const assert = require('node:assert/strict')

// Assert that a dotted path is present (not undefined/null) in value.
// "a[]" requires a non-empty array and checks the rest of the path on
// every element; a leading "[]" applies to value itself.
//   expectPath(body, 'data[].person.email')
function expectPath(value, path, where = '') {
    const [head, ...rest] = path.split('.')
    const isArray = head.endsWith('[]')
    const key = isArray ? head.slice(0, -2) : head
    const next = key === '' ? value : value?.[key]
    const here = where ? `${where}.${key}` : key || '(root)'
    assert.ok(next !== undefined && next !== null, `missing ${here} (path ${path})`)
    if (isArray) {
        assert.ok(Array.isArray(next), `${here}: array expected, got ${JSON.stringify(next)}`)
        assert.ok(next.length > 0, `${here}: non-empty array expected`)
        if (rest.length) next.forEach((item, i) => expectPath(item, rest.join('.'), `${here}[${i}]`))
    } else if (rest.length) {
        expectPath(next, rest.join('.'), here)
    }
}

function expectPaths(value, paths) {
    for (const path of paths) expectPath(value, path)
}

// The element of list whose _id is the id of the given fixture document.
function byId(list, doc) {
    assert.ok(Array.isArray(list), `array expected, got ${JSON.stringify(list)}`)
    const found = list.find(item => String(item._id) === String(doc._id))
    assert.ok(found, `record ${doc._id} not found among ${list.map(item => item._id).join(', ') || 'no records'}`)
    return found
}

// For responses without _id: the element whose startDate equals the
// fixture's (e.g. visits of the same person).
function byStartDate(list, doc) {
    assert.ok(Array.isArray(list), `array expected, got ${JSON.stringify(list)}`)
    const startDate = doc.startDate.toISOString()
    const found = list.find(item => item.startDate === startDate)
    assert.ok(found, `no record starting at ${startDate} among ${list.map(item => item.startDate).join(', ') || 'no records'}`)
    return found
}

// Assert the list contains exactly the given fixture documents (any order).
function expectIds(list, docs) {
    assert.ok(Array.isArray(list), `array expected, got ${JSON.stringify(list)}`)
    assert.deepEqual(list.map(item => String(item._id)).sort(), docs.map(doc => String(doc._id)).sort())
}

module.exports = { expectPath, expectPaths, byId, byStartDate, expectIds }
