const assert = require('node:assert/strict')
const { test } = require('node:test')
const Room = require('../models/Room')

// No MongoDB connection: intercept writes while exercising real save middleware.
test('creating a room saves its generated code', async t => {
    const insert = t.mock.method(Room.collection, 'insertOne', async document => ({
        acknowledged: true, insertedId: document._id,
    }))
    const room = new Room({ building: 'A', floor: '1', number: '123' })

    await room.save()

    assert.equal(insert.mock.calls.length, 1)
    assert.equal(insert.mock.calls[0].arguments[0].code, 'A1:123')
})

test('editing a room saves changed fields and recalculates its code', async t => {
    const update = t.mock.method(Room.collection, 'updateOne', async () => ({
        acknowledged: true, matchedCount: 1, modifiedCount: 1,
    }))
    const room = Room.hydrate({
        _id: '0123456789abcdef01234567',
        building: 'A', floor: '1', number: '123', code: 'A1:123',
    })

    room.set({ description: 'Updated description', nSeats: 4 })
    await room.save()
    assert.equal(room.code, 'A1:123')
    const firstUpdate = update.mock.calls[0].arguments[1].$set
    assert.equal(firstUpdate.description, 'Updated description')
    assert.equal(firstUpdate.nSeats, 4)

    room.set({ building: 'B', floor: '2', number: '456' })
    await room.save()
    assert.equal(update.mock.calls.length, 2)
    assert.equal(update.mock.calls[1].arguments[1].$set.code, 'B2:456')
})
