// dm-planimetrie: the interactive map (src/element.jsx, embedded by the
// WordPress [planimetrie] shortcode and by dm-monitor) reads public rooms;
// the polygon editor (tool/tool.jsx) uses the "planimetrie" token.

const assert = require('node:assert/strict')
const { expectPaths, byId } = require('../support/contractAssertions.cjs')

const ROLES = ['/process/planimetrie']

const contracts = [
    {
        name: 'map: public rooms with polygon and current occupants',
        browser: true,
        roles: null,
        path: () => '/api/v0/public/rooms',
        check(body, fx) {
            for (const room of body.data) {
                expectPaths(room, ['_id', 'code', 'building', 'floor', 'number'])
                assert.ok(Array.isArray(room.roomAssignments), `roomAssignments must be an array for room ${room.code}`)
            }
            expectPaths(byId(body.data, fx.rooms.studio), [
                'polygon', 'roomAssignments[].person._id',
                'roomAssignments[].person.firstName', 'roomAssignments[].person.lastName',
            ])
        },
    },
    {
        name: 'editor: list rooms',
        browser: true,
        roles: ROLES,
        path: () => '/api/v0/process/planimetrie/',
        check(body, fx) {
            expectPaths(byId(body.data, fx.rooms.studio), ['_id', 'code', 'polygon'])
        },
    },
    {
        name: 'editor: save notes and polygon of a room',
        browser: true,
        roles: ROLES,
        method: 'POST',
        path: fx => `/api/v0/process/planimetrie/${fx.rooms.editableRoom._id}`,
        body: () => ({ notes: 'Edited by the map tool', polygon: JSON.stringify([{ x: 1, y: 2, z: 3 }]) }),
        async check(body, fx) {
            assert.deepEqual(body, {})
            const Room = require('../../models/Room')
            const room = await Room.findById(fx.rooms.editableRoom._id).lean()
            assert.equal(room.notes, 'Edited by the map tool')
            assert.deepEqual(JSON.parse(room.polygon), [{ x: 1, y: 2, z: 3 }])
        },
    },
]

module.exports = { contracts }
