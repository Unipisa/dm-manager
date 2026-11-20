// WordPress theme (github.com/Unipisa/dm-wordpress), server side with the
// DM_MANAGER_TOKEN bearer token:
//   dm_manager_get($model, $sort, $filter) -> GET <model>?_sort=..&<filters>, expects {data: [...]}
//   dm_manager_get_by_id($model, $id)      -> GET <model>/<id>, expects the bare document
// inc/dm-manager/api.php turns shortcode filters into query params
// ("current" -> startDate__lte_or_null=today&endDate__gte_or_null=today,
// "year=Y" -> startDate__lte_or_null=Y-12-31&endDate__gte_or_null=Y-01-01).
//
// Only the shortcodes found in the published pages of all the network sites
// (November 2026) are listed, with their actual attributes. The widgets
// ([dm_manager_widget]), [event_calendar] and [planimetrie] have their own
// contract files.

const assert = require('node:assert/strict')
const { expectPaths, byId, expectIds } = require('../support/contractAssertions.cjs')
const { isoDay } = require('../support/contractFixtures.cjs')

// Minimal roles of the WordPress token.
const ROLES = [
    'staff-supervisor', 'visit-supervisor', 'group-supervisor', 'person-supervisor', 'event-phd-course-supervisor',
]

const CURRENT = 'startDate__lte_or_null=today&endDate__gte_or_null=today'

// [staff_manager sort_field="person" filter="qualification__in=...,isInternal=1, current"]
// fields: person.firstName, person.lastName, person.email, person.phone, person._id, qualification
const staffManager = (label, qualifications, expected) => ({
    name: `[staff_manager] ${label}`,
    path: () => `/api/v0/staff?_sort=person&qualification__in=${encodeURIComponent(qualifications)}&isInternal=1&${CURRENT}`,
    check(body, fx) {
        expectIds(body.data, expected(fx))
        for (const staff of body.data) {
            expectPaths(staff, ['qualification', 'person._id', 'person.firstName', 'person.lastName', 'person.email'])
        }
    },
})

const contracts = [
    staffManager('faculty', 'PO|PA|RTDa|RTDb|RTT|RIC', fx => [fx.staff.alice]),
    staffManager('collaborators', 'Collaboratore', fx => [fx.staff.bruno]),
    staffManager('PhD students', 'Dottorando in Matematica|Dottorando in HPSC', fx => [fx.staff.elena]),
    staffManager('research staff (none)', 'Assegnista|Tecnologo|Titolare di borsa di ricerca|Titolare di contratto di ricerca|Titolare di incarico post-doc|Titolare di incarico di ricerca', () => []),

    // [visit_manager fields="person.firstName,person.lastName,affiliations,startDate,endDate"
    //   sort_field="person" filter="year=Y,grants=ID"]
    {
        name: '[visit_manager] visits funded by a grant in a year',
        path: fx => {
            const year = fx.visits.current.startDate.getFullYear()
            return `/api/v0/visit?_sort=person&startDate__lte_or_null=${year}-12-31&endDate__gte_or_null=${year}-01-01&grants=${fx.grant._id}`
        },
        check(body, fx) {
            const visit = byId(body.data, fx.visits.current)
            expectPaths(visit, ['startDate', 'endDate', 'person.firstName', 'person.lastName', 'affiliations[].name'])
        },
    },

    // [dm_manager_group_cards group_id=ID] (34 pages)
    {
        name: '[dm_manager_group_cards group_id=ID]',
        path: fx => `/api/v0/group/${fx.council._id}`,
        check(body, fx) {
            assert.equal(String(body._id), String(fx.council._id), 'bare document expected')
            expectPaths(body, ['members[]._id', 'members[].firstName', 'members[].lastName', 'members[].email',
                'members[].affiliations[].name', 'members[].staffs[].isInternal',
                'chair._id', 'chair.firstName', 'chair.lastName', 'chair_title', 'vice._id', 'vice.lastName', 'vice_title'])
        },
    },

    // [dm_manager_person_card person_id=ID] (11 pages)
    {
        name: '[dm_manager_person_card person_id=ID]',
        path: fx => `/api/v0/person/${fx.people.alice._id}`,
        check(body, fx) {
            assert.equal(String(body._id), String(fx.people.alice._id), 'bare document expected')
            expectPaths(body, ['firstName', 'lastName', 'email', 'affiliations[].name', 'staffs[].isInternal'])
        },
    },

    // [phd_course_detail] on /phd-hpsc/, course id from ?phd_course_id=
    {
        name: '[phd_course_detail]',
        path: fx => `/api/v0/event-phd-course/${fx.course._id}`,
        check(body, fx) {
            assert.equal(String(body._id), String(fx.course._id), 'bare document expected')
            expectPaths(body, ['title', 'description', 'lecturers[].firstName', 'lecturers[].lastName',
                'lessons[].date', 'lessons[].duration', 'lessons[].conferenceRoom.name'])
        },
    },

    // page-notiziario.php (newsletter page template, anonymous, server side)
    {
        name: 'newsletter: seminars of the next two weeks',
        roles: null,
        path: () => `/api/v0/public/seminars?from=${isoDay()}&to=${isoDay(15)}`,
        check(body, fx) {
            expectPaths(byId(body.data, fx.seminars.upcoming), ['_id', 'title', 'startDatetime', 'duration',
                'speaker.firstName', 'speaker.lastName', 'conferenceRoom.name'])
        },
    },
    {
        name: 'newsletter: conferences of the next two weeks',
        roles: null,
        path: () => `/api/v0/public/conferences?from=${isoDay()}&to=${isoDay(15)}`,
        check(body, fx) {
            expectPaths(byId(body.data, fx.conference), ['_id', 'title', 'startDate', 'endDate', 'conferenceRoom.name'])
        },
    },
].map(contract => ({ roles: ROLES, ...contract }))

module.exports = { contracts, ROLES }
