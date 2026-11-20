// WordPress theme (github.com/Unipisa/dm-wordpress), server side with the
// DM_MANAGER_TOKEN bearer token:
//   dm_manager_get($model, $sort, $filter) -> GET <model>?_sort=..&<filters>, expects {data: [...]}
//   dm_manager_get_by_id($model, $id)      -> GET <model>/<id>, expects the bare document
// See inc/dm-manager/api.php for how shortcode filters become query params
// ("current", "past", "perspective", "year=Y", "dateyear=Y", key=value).
// The newsletter (page-notiziario.php) calls public endpoints directly.

const assert = require('node:assert/strict')
const { expectPaths, byId, expectIds } = require('../support/contractAssertions.cjs')
const { isoDay } = require('../support/contractFixtures.cjs')

// Minimal roles of the WordPress token: read access to these models only.
const ROLES = [
    'visit-supervisor', 'staff-supervisor', 'thesis-supervisor', 'grant-supervisor',
    'group-supervisor', 'person-supervisor', 'event-phd-course-supervisor',
]

const CURRENT = 'startDate__lte_or_null=today&endDate__gte_or_null=today'
const ACTIVE = 'endDate__gte_or_null=today&startDate__lte_or_null=today'

const contracts = [
    // [visit_manager] / [dm_manager]
    {
        name: '[visit_manager filter=current]',
        path: () => `/api/v0/visit?_sort=person&${CURRENT}`,
        check(body, fx) {
            expectIds(body.data, [fx.visits.current])
            expectPaths(body.data[0], ['startDate', 'endDate', 'person._id', 'person.firstName',
                'person.lastName', 'affiliations[].name'])
        },
    },
    {
        name: '[visit_manager filter=past]',
        path: () => '/api/v0/visit?_sort=person&endDate__lt=today',
        check: (body, fx) => expectIds(body.data, [fx.visits.past]),
    },
    {
        name: '[visit_manager filter=perspective]',
        path: () => '/api/v0/visit?_sort=person&startDate__gt=today',
        check: (body, fx) => expectIds(body.data, [fx.visits.future]),
    },
    {
        name: '[visit_manager filter=year=Y]',
        path: fx => {
            const year = fx.visits.current.startDate.getFullYear()
            return `/api/v0/visit?_sort=person&startDate__lte_or_null=${year}-12-31&endDate__gte_or_null=${year}-01-01`
        },
        check: (body, fx) => assert.ok(body.data.some(v => String(v._id) === String(fx.visits.current._id))),
    },
    // [dm_manager_thesis]
    {
        name: '[dm_manager_thesis filter=dateyear=Y]',
        path: fx => {
            const year = fx.thesis.date.getFullYear()
            return `/api/v0/thesis?_sort=person&date__lte=${year}-12-31&date__gte=${year}-01-01`
        },
        check(body, fx) {
            expectPaths(byId(body.data, fx.thesis), [
                'title', 'date', 'person._id', 'person.firstName', 'person.lastName',
                'advisors[]._id', 'advisors[].firstName', 'advisors[].lastName', 'advisors[].staffs[].isInternal',
                'institutions[].name',
            ])
        },
    },
    // [staff_manager]
    {
        name: '[staff_manager filter=current]',
        path: () => `/api/v0/staff?_sort=person&${CURRENT}`,
        check(body, fx) {
            expectIds(body.data, [fx.staff.alice, fx.staff.bruno, fx.staff.elena])
            expectPaths(byId(body.data, fx.staff.alice), [
                'qualification', 'SSD', 'person._id', 'person.firstName', 'person.lastName', 'person.email',
            ])
        },
    },
    {
        name: '[staff_manager filter=qualification=PO]',
        path: () => `/api/v0/staff?_sort=person&qualification=PO&${CURRENT}`,
        check: (body, fx) => expectIds(body.data, [fx.staff.alice]),
    },
    // [grant_manager] and [grant_manager_details]
    {
        name: '[grant_manager]',
        path: () => `/api/v0/grant?_sort=startDate&${CURRENT}`,
        check(body, fx) {
            const grant = byId(body.data, fx.grant)
            expectPaths(grant, ['_id', 'name', 'projectType', 'funds', 'startDate', 'endDate',
                'pi._id', 'pi.firstName', 'pi.lastName', 'pi.staffs[].isInternal',
                'localCoordinator._id', 'localCoordinator.lastName'])
            assert.ok(Array.isArray(grant.SSD), 'SSD is an array (imploded by the theme)')
        },
    },
    {
        name: '[grant_manager_details grant_id=ID]',
        path: fx => `/api/v0/grant/${fx.grant._id}`,
        check(body, fx) {
            assert.equal(String(body._id), String(fx.grant._id), 'bare document expected')
            expectPaths(body, ['name', 'projectType', 'fundingEntity', 'startDate', 'endDate', 'budgetAmount',
                'webSite', 'description', 'pi.firstName', 'pi.affiliations[].name', 'pi.staffs',
                'localCoordinator.lastName', 'members[].firstName', 'members[].lastName', 'members[].affiliations[].name'])
        },
    },
    // [dm_manager_group] and [dm_manager_group_cards]
    {
        name: '[dm_manager_group group_id=ID]',
        path: fx => `/api/v0/group/${fx.council._id}`,
        check(body, fx) {
            assert.equal(String(body._id), String(fx.council._id), 'bare document expected')
            expectPaths(body, ['members[]._id', 'members[].firstName', 'members[].lastName', 'members[].email',
                'members[].affiliations[].name', 'members[].staffs[].isInternal',
                'chair.firstName', 'chair.lastName', 'chair_title', 'vice.lastName', 'vice_title'])
        },
    },
    // [dm_manager_person_details] and [dm_manager_person_card]
    {
        name: '[dm_manager_person_details]: person',
        path: fx => `/api/v0/person/${fx.people.alice._id}`,
        check(body, fx) {
            assert.equal(String(body._id), String(fx.people.alice._id), 'bare document expected')
            expectPaths(body, ['firstName', 'lastName', 'gender', 'email', 'orcid',
                'affiliations[].name', 'staffs[].qualification', 'staffs[].isInternal'])
        },
    },
    {
        name: '[dm_manager_person_details]: current staff record with office',
        path: fx => `/api/v0/staff?_sort=-endDate&person=${fx.people.alice._id}&${ACTIVE}`,
        check(body, fx) {
            expectIds(body.data, [fx.staff.alice])
            expectPaths(body.data[0], ['matricola', 'roomAssignments[].room._id', 'roomAssignments[].room.building',
                'roomAssignments[].room.floor', 'roomAssignments[].room.number'])
        },
    },
    ...['members', 'chair', 'vice'].map(role => ({
        name: `[dm_manager_person_details]: groups where the person is ${role}`,
        path: fx => `/api/v0/group?_sort=name&${role}=${fx.people[role === 'vice' ? 'bruno' : 'alice']._id}&${ACTIVE}`,
        // people.php reads $group['chair']['_id'] and ['vice']['_id'], but the
        // group index only populates members: chair and vice are plain ids,
        // which is a fatal TypeError on PHP 8.
        todo: 'group index does not populate chair and vice',
        check(body, fx) {
            expectIds(body.data, [fx.council])
            expectPaths(body.data[0], ['_id', 'name', 'members[]', 'chair._id', 'vice._id', 'chair_title', 'vice_title'])
        },
    })),
    ...['pi', 'localCoordinator', 'members'].map(role => ({
        name: `[dm_manager_person_details]: current grants where the person is ${role}`,
        path: fx => `/api/v0/grant?_sort=-endDate&${role}=${fx.people.alice._id}&endDate__gte=today&startDate__lte=today`,
        check(body, fx) {
            expectIds(body.data, [fx.grant])
            expectPaths(body.data[0], ['_id', 'name', 'projectType', 'startDate', 'endDate', 'pi.firstName', 'pi.lastName'])
        },
    })),
    // [phd_course_detail]
    {
        name: '[phd_course_detail phd_course_id=ID]',
        path: fx => `/api/v0/event-phd-course/${fx.course._id}`,
        check(body, fx) {
            assert.equal(String(body._id), String(fx.course._id), 'bare document expected')
            expectPaths(body, ['title', 'description', 'lecturers[].firstName', 'lecturers[].lastName',
                'lessons[].date', 'lessons[].duration', 'lessons[].conferenceRoom.name'])
        },
    },
    // page-notiziario.php (anonymous, server side)
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
