// dm-calendar (github.com/Unipisa/dm-calendar), embedded by the WordPress
// [event_calendar] shortcode with endpoint="https://manage.dm.unipi.it".
// Anonymous, cross-origin. Requests from src/element.jsx.

const { expectPaths, expectIds } = require('../support/contractAssertions.cjs')
const { daysFromNow } = require('../support/contractFixtures.cjs')

const range = () => `from=${daysFromNow(-7).toISOString()}&to=${daysFromNow(35).toISOString()}`

const contracts = [
    {
        name: 'PhD lessons in the visible range',
        path: () => `/api/v0/public/lessons?${range()}`,
        check(body) {
            expectPaths(body, [
                'data[].date', 'data[].duration', 'data[].conferenceRoom.name',
                'data[].course._id', 'data[].course.title', 'data[].course.lecturers[].lastName',
            ])
        },
    },
    {
        name: 'PhD lessons of one programme ("phd-courses=Matematica")',
        path: () => `/api/v0/public/lessons?${range()}&phd=Matematica`,
        check(body) {
            expectPaths(body, ['data[].course.title'])
        },
    },
    {
        name: 'seminars in the visible range, filtered by category client-side',
        path: () => `/api/v0/public/seminars?_limit=500&_sort=startDateTime&${range()}`,
        check(body, fx) {
            // The past seminar (10 days ago) is outside the range.
            expectIds(body.data, [fx.seminars.upcoming])
            expectPaths(body.data[0], [
                'title', 'startDatetime', 'duration', 'category[].label', 'speakers[].lastName', 'conferenceRoom.name',
            ])
        },
    },
].map(contract => ({ browser: true, roles: null, ...contract }))

module.exports = { contracts }
