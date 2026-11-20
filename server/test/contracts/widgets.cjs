// Widgets embedded in the department website (widgets/src, served as
// /static/dmwidgets.js and loaded by the WordPress [dm_manager_widget]
// shortcode). Anonymous, cross-origin requests to /api/v0/public/*.
// Shared query parameters are built in widgets/src/people-query.js.

const assert = require('node:assert/strict')
const { expectPaths, byId, byStartDate, expectIds } = require('../support/contractAssertions.cjs')
const { isoDay } = require('../support/contractFixtures.cjs')

const CURRENT = 'startDate__lte_or_null=today&endDate__gte_or_null=today'

const contracts = [
    {
        name: 'SeminarList/EventList: upcoming seminars',
        path: () => `/api/v0/public/seminars?_sort=startDatetime&from=${encodeURIComponent(new Date().toISOString())}&_limit=10`,
        check(body, fx) {
            expectIds(body.data, [fx.seminars.upcoming])
            expectPaths(body.data[0], [
                '_id', 'title', 'startDatetime', 'duration', 'abstract',
                'speakers[].firstName', 'speakers[].lastName', 'speakers[].affiliations[].name',
                'category[]._id', 'category[].name', 'category[].label',
                'conferenceRoom.name', 'conferenceRoom.room',
            ])
        },
    },
    {
        name: 'SeminarList: filter by category and grant within a date range',
        path: fx => `/api/v0/public/seminars?from=${isoDay(-30)}&to=${isoDay(30)}&category=${fx.category._id}&grants=${fx.grant._id}`,
        check: (body, fx) => expectIds(body.data, [fx.seminars.upcoming]),
    },
    {
        name: 'Seminar: single seminar as data[0]',
        path: fx => `/api/v0/public/seminar/${fx.seminars.upcoming._id}`,
        check(body) {
            assert.equal(body.data.length, 1)
            expectPaths(body.data[0], ['title', 'startDatetime', 'duration', 'speakers[].lastName', 'conferenceRoom.name'])
        },
    },
    {
        name: 'ConferenceList/EventList: upcoming conferences',
        path: () => `/api/v0/public/conferences?_sort=startDate&from=${isoDay()}&_limit=10`,
        check(body, fx) {
            expectIds(body.data, [fx.conference])
            expectPaths(body.data[0], [
                '_id', 'title', 'startDate', 'endDate', 'SSD[]', 'url', 'description',
                'conferenceRoom.name', 'conferenceRoom.room', 'institution.name',
            ])
        },
    },
    {
        name: 'ConferenceList: filter by grant, SSD and outreach',
        path: fx => `/api/v0/public/conferences?from=${isoDay(-30)}&to=${isoDay(30)}&grants=${fx.grant._id}&ssd=MATH-02/A&is_outreach=false`,
        check: (body, fx) => expectIds(body.data, [fx.conference]),
    },
    {
        name: 'Conference: single conference as data[0]',
        path: fx => `/api/v0/public/conference/${fx.conference._id}`,
        check(body) {
            assert.equal(body.data.length, 1)
            expectPaths(body.data[0], ['title', 'startDate', 'endDate', 'description'])
        },
    },
    {
        name: 'CourseList: PhD courses of a programme',
        path: () => `/api/v0/public/courses?phd=Matematica&from=${isoDay(-30)}&to=${isoDay(60)}`,
        check(body, fx) {
            const course = byId(body.data, fx.course)
            expectPaths(course, [
                '_id', 'title', 'startDate', 'endDate', 'activationStatus', 'courseType',
                'lecturers[]._id', 'lecturers[].firstName', 'lecturers[].lastName', 'lecturers[].affiliations[].name',
                'lessons[].date', 'lessons[].duration', 'lessons[].conferenceRoom',
            ])
            assert.equal(typeof course.lessons[0].conferenceRoom, 'string', 'lesson conferenceRoom is a room name')
        },
    },
    {
        name: 'Course: single course as data[0]',
        path: fx => `/api/v0/public/course/${fx.course._id}`,
        check(body) {
            expectPaths(body, ['data[].title', 'data[].lecturers[].lastName', 'data[].lessons[].date'])
        },
    },
    {
        name: 'GrantList: current grants in shortcode format',
        path: () => `/api/v0/public/grants?_format=shortcode&_sort=startDate&${CURRENT}&SSD=MATH-02/A`,
        check(body, fx) {
            const grant = byId(body.data, fx.grant)
            expectPaths(grant, [
                'name', 'projectType', 'startDate', 'endDate', 'SSD', 'funds',
                'pi._id', 'pi.firstName', 'pi.lastName', 'pi.affiliations[].name',
                'localCoordinator._id', 'localCoordinator.lastName',
            ])
        },
    },
    {
        name: 'HomeGrantList: grants from a date, with PI staff status',
        path: () => `/api/v0/public/grants?from=${encodeURIComponent(new Date(Date.now() - 365 * 864e5).toISOString())}`,
        check(body, fx) {
            const grant = byId(body.data, fx.grant)
            expectPaths(grant, ['name', 'startDate', 'endDate', 'budgetAmount', 'projectType',
                'pi._id', 'pi.firstName', 'pi.lastName', 'pi.staff[]', 'localCoordinator._id'])
        },
    },
    {
        name: 'Grant: single grant with people as data[0]',
        path: fx => `/api/v0/public/grant/${fx.grant._id}`,
        check(body) {
            expectPaths(body.data[0], [
                'name', 'startDate', 'endDate', 'fundingEntity', 'budgetAmount', 'webSite', 'description',
                'pi.firstName', 'pi.affiliations[].name', 'localCoordinator.lastName',
                'members[].firstName', 'members[].lastName',
            ])
        },
    },
    {
        name: 'ThesisList: theses of a period in shortcode format',
        path: fx => `/api/v0/public/theses?_format=shortcode&_sort=-date&date__gte=${isoDay(-365)}&date__lt=${encodeURIComponent(new Date().toISOString())}&SSD=MATH-02/A&institutions=${fx.institutions.pisa._id}`,
        check(body, fx) {
            const thesis = byId(body.data, fx.thesis)
            expectPaths(thesis, [
                'title', 'date', 'SSD', 'person._id', 'person.firstName', 'person.lastName',
                'advisors[]._id', 'advisors[].lastName', 'institutions[].name',
            ])
        },
    },
    {
        name: 'StaffList: current staff by qualification, with office',
        path: () => `/api/v0/public/staff-list?_sort=person&${CURRENT}&qualification__in=PO|Collaboratore`,
        check(body, fx) {
            expectIds(body.data, [fx.staff.alice, fx.staff.bruno])
            expectPaths(byId(body.data, fx.staff.alice), [
                'qualification', 'SSD', 'isInternal', 'startDate',
                'person._id', 'person.firstName', 'person.lastName', 'person.email', 'person.affiliations[].name',
                'roomAssignment.room._id', 'roomAssignment.room.building', 'roomAssignment.room.floor', 'roomAssignment.room.number',
            ])
        },
    },
    {
        name: 'VisitList: current visits of a grant, with office',
        path: fx => `/api/v0/public/visit-list?_sort=person&${CURRENT}&grants=${fx.grant._id}`,
        check(body, fx) {
            expectIds(body.data, [fx.visits.current])
            expectPaths(body.data[0], [
                'startDate', 'endDate', 'collaborationTheme', 'affiliations[].name',
                'person._id', 'person.firstName', 'person.lastName', 'person.affiliations[].name',
                'roomAssignment.room.building', 'roomAssignment.room.floor', 'roomAssignment.room.number',
            ])
        },
    },
    {
        name: 'HomeVisitList: current visits',
        path: () => '/api/v0/public/visits?_limit=10&_sort=startDate',
        check(body, fx) {
            assert.equal(body.data.length, 1)
            expectPaths(byStartDate(body.data, fx.visits.current), ['startDate', 'endDate', 'person.firstName',
                'person.lastName', 'person.affiliations[].name', 'roomAssignment.room._id', 'roomAssignment.room.number'])
        },
    },
    {
        name: 'HomeVisitList: future visits',
        path: () => '/api/v0/public/visits?_limit=10&_sort=startDate&future=true',
        check(body, fx) {
            assert.equal(body.data.length, 1)
            expectPaths(byStartDate(body.data, fx.visits.future), ['startDate', 'endDate', 'person.firstName',
                'person.lastName', 'person.affiliations[].name'])
        },
    },
    {
        name: 'PersonDetails/PersonCard: person profile as data',
        path: fx => `/api/v0/public/person/${fx.people.alice._id}`,
        check(body, fx) {
            assert.equal(String(body.data._id), String(fx.people.alice._id))
            expectPaths(body.data, [
                'firstName', 'lastName', 'gender', 'email', 'orcid',
                'staffs[].qualification', 'staffs[].SSD[]', 'staffs[].matricola',
                'roomAssignments[].room', 'roomAssignments[].roomDetails.building',
                'roomAssignments[].roomDetails.floor', 'roomAssignments[].roomDetails.number',
                'grants[]._id', 'grants[].name', 'grants[].piDetails.lastName',
                'groups[].name', 'groups[].chair', 'groups[].chair_title',
            ])
        },
    },
    {
        name: 'GroupCards: group members, chair and vice as data',
        path: fx => `/api/v0/public/group/${fx.council._id}`,
        check(body) {
            expectPaths(body.data, [
                'members[]._id', 'members[].firstName', 'members[].lastName', 'members[].staffs[].isInternal',
                'chair.firstName', 'chair.lastName', 'chair_title', 'vice.lastName', 'vice_title',
            ])
        },
    },
    {
        name: 'PersonDetails: teaching and publications from University APIs',
        path: () => '/api/v0/public/unimap/a000001',
        check(body) {
            expectPaths(body, ['registri[]', 'arpiLink', 'arpiPublishedPapers[]', 'arpiAcceptedPapers[]'])
        },
    },
].map(contract => ({ browser: true, roles: null, ...contract }))

module.exports = { contracts }
