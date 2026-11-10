const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { pathToFileURL } = require('node:url')

// Mock the Rooms service and configuration; never load credentials or access a database.
async function queryRooms(payload) {
    let handler
    const module = { exports: {} }
    const filename = path.resolve(__dirname, '../controllers/processes/mrbsRoomsBookings.js')
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
        module,
        console,
        require(name) {
            if (name === 'express') return { Router: () => ({}) }
            if (name === 'axios') return { post: async () => ({ data: payload }) }
            if (name === '../../config') return { MRBS_API_URL: 'https://rooms.example', MRBS_API_SECRET_TOKEN: 'test' }
            throw new Error(`Unexpected dependency: ${name}`)
        }
    }, { filename })
    module.exports({ post(route, callback) { handler = callback } })
    const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this },
        json(body) { this.body = body; return this }
    }
    await handler({ body: { action: 'query', start_time: 100, end_time: 200 } }, res)
    return res
}

test('availability proxy preserves valid room lists, including no available rooms', async () => {
    for (const rooms of [[], [{ id: 33, area_id: 4, name: 'Test room' }]]) {
        const res = await queryRooms(rooms)
        assert.equal(res.statusCode, 200)
        assert.equal(res.body, rooms)
    }
})

test('availability proxy preserves upstream errors for inspection in the Network tab', async () => {
    const phpError = "<br /><b>Parse error</b>: Unclosed '{' in /var/www/html/api.php"
    for (const payload of [phpError, null, {}, { error: 'Unavailable' }]) {
        const res = await queryRooms(payload)
        assert.equal(res.statusCode, 200)
        assert.equal(res.body, payload)
    }
})

test('frontend rejects invalid payloads before filtering and preserves the availability error state', async t => {
    let payload
    t.mock.method(globalThis, 'fetch', async () => ({
        status: 200,
        json: async () => payload
    }))
    const apiUrl = pathToFileURL(path.resolve(__dirname, '../../frontend/src/api.js')).href
    const filename = path.resolve(__dirname, '../../frontend/src/processes/RoomsBookings.jsx')
    const source = fs.readFileSync(filename, 'utf8').replace("'../api'", JSON.stringify(apiUrl))
    const { queryAvailableRooms, handleRoomBooking } = await import(
        `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
    )
    t.mock.method(console, 'error', () => {})
    for (payload of ['<b>Parse error</b>', null, {}, { error: 'Unavailable' }]) {
        await assert.rejects(queryAvailableRooms(new Date(100000), new Date(200000), 'seminars'),
            /Check the mrbsRoomsBookings response in the Network tab/)
    }
    for (payload of [[], [{ id: 33, area_id: 4, name: 'Test room' }]]) {
        assert.equal(await queryAvailableRooms(new Date(100000), new Date(200000), 'seminars'), payload)
    }
    payload = '<b>Parse error</b>'
    const result = await handleRoomBooking({
        conferenceRoom: { mrbsRoomID: 33, name: 'Test room' },
        startDatetime: new Date(100000), duration: 60
    }, 'seminars')
    assert.equal(result.type, 'error')
    assert.match(result.error.message, /Rooms returned an invalid availability response/)
})
