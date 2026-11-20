// dm-monitor (department info screens). Anonymous, cross-origin.
// Requests from src/pages/eventsAndVisitorsPage.js and stanze.js.

const assert = require('node:assert/strict')
const { expectPaths, byId, byStartDate } = require('../support/contractAssertions.cjs')
const { isoDay } = require('../support/contractFixtures.cjs')

function romeMidnight() {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date.toISOString()
}

const contracts = [
    {
        name: 'seminars from today',
        path: () => `/api/v0/public/seminars?from=${romeMidnight()}&_sort=startDatetime`,
        check(body, fx) {
            expectPaths(byId(body.data, fx.seminars.upcoming), [
                'title', 'startDatetime', 'duration', 'conferenceRoom.name',
                'speakers[].firstName', 'speakers[].lastName', 'speakers[].affiliations[].name',
                'speaker.lastName',
            ])
        },
    },
    {
        name: 'conferences from today',
        path: () => `/api/v0/public/conferences?from=${isoDay()}&_sort=startDate`,
        check(body, fx) {
            expectPaths(byId(body.data, fx.conference), ['title', 'startDate', 'endDate', 'conferenceRoom.name', 'institution.name'])
        },
    },
    {
        name: 'visits, sorted client-side by startDate string',
        path: () => '/api/v0/public/visits',
        check(body, fx) {
            const visit = byStartDate(body.data, fx.visits.current)
            expectPaths(visit, ['startDate', 'endDate', 'person.firstName', 'person.lastName',
                'person.affiliations[].name', 'roomAssignment.room.building', 'roomAssignment.room.number'])
            assert.equal(typeof visit.startDate, 'string')
        },
    },
    {
        name: 'rooms with map polygons',
        path: () => '/api/v0/public/rooms',
        check(body, fx) {
            const room = byId(body.data, fx.rooms.studio)
            expectPaths(room, ['code', 'polygon'])
            assert.equal(typeof room.polygon, 'string', 'polygon is a JSON string')
        },
    },
].map(contract => ({ browser: true, roles: null, ...contract }))

module.exports = { contracts }
