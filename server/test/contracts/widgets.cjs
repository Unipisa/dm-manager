// Widgets embedded in the department website through
// [dm_manager_widget widget="Name" ...] (inc/dm-manager/widgets.php in the
// WordPress theme), loaded from /static/dmwidgets.js. The theme passes the
// shortcode attributes, merged with the page query string, as props.
//
// Each contract renders the real widget with attribute combinations found in
// the published pages (November 2026), so its requests are built by the
// widget code itself. Anonymous, cross-origin requests to /api/v0/public/*.

const assert = require('node:assert/strict')
const { createWidgetHarness } = require('../support/widgetHarness.cjs')
const { isoDay } = require('../support/contractFixtures.cjs')

const harnesses = new WeakMap()
function harness(api) {
    if (!harnesses.has(api)) harnesses.set(api, createWidgetHarness(api))
    return harnesses.get(api)
}

// shows: texts the rendered widget must contain; hides: texts it must not.
function widget(name, label, props, shows, hides = () => []) {
    return {
        name: `${name}: ${label}`,
        async run(api, fx) {
            const { html, requests, errors } = await harness(api).render(name, props(fx))
            assert.deepEqual(errors.map(error => error.message), [], `${name} queries failed`)
            assert.ok(requests.length > 0, `${name} made no request; rendered: ${html.slice(0, 300)}`)
            for (const request of requests) {
                assert.equal(request.status, 200, request.url)
                assert.ok(request.cors, `CORS header missing for ${request.url}`)
            }
            for (const text of shows(fx)) assert.ok(html.includes(text), `${name}: "${text}" not rendered`)
            for (const text of hides(fx)) assert.ok(!html.includes(text), `${name}: "${text}" should not be rendered`)
        },
    }
}

const id = doc => String(doc._id)

const contracts = [
    // PeopleCards (230 uses): group members or a single person card.
    widget('PeopleCards', 'internal members of a group', fx => ({ group_id: id(fx.council), is_internal: '1' }),
        () => ['Rossi', 'Bianchi', 'Presidente']),
    widget('PeopleCards', 'all members of a group', fx => ({ group_id: id(fx.council) }),
        () => ['Rossi', 'Bianchi']),
    widget('PeopleCards', 'one person', fx => ({ person_id: id(fx.people.alice) }),
        () => ['Alice', 'Rossi']),

    // StaffList
    widget('StaffList', 'current internal staff of an SSD by qualification',
        () => ({ qualification: 'PO,PA,RTDa', is_internal: '1', ssd: 'MATH-02/A', status: 'current' }),
        () => ['Rossi'], () => ['Bianchi', 'Neri']),
    widget('StaffList', 'current staff by qualification',
        () => ({ qualification: 'Collaboratore', status: 'current' }),
        () => ['Bianchi'], () => ['Verdi']),
    widget('StaffList', 'internal staff who started in a period',
        () => ({ qualification: 'Dottorando in Matematica', is_internal: '1', start_from: isoDay(-500), start_to: isoDay() }),
        () => ['Neri']),

    // VisitList
    widget('VisitList', 'current visits of an SSD',
        () => ({ status: 'current', sort_by: 'name', order: 'asc', ssd: 'MATH-02/A' }),
        () => ['Ivanov', 'Example University']),
    widget('VisitList', 'past visits grouped by year',
        () => ({ status: 'past', sort_by: 'start_date', order: 'desc', group_by_year: '1' }),
        () => ['Ivanov']),
    widget('VisitList', 'visits funded by a grant, grouped by year',
        fx => ({ grants: id(fx.grant), group_by_year: '1' }),
        () => ['Ivanov']),

    // GrantList
    widget('GrantList', 'current grants of an SSD',
        () => ({ status: 'current', ssd: 'MATH-02/A', sort_by: 'start_date', order: 'desc' }),
        () => ['Example PRIN', 'Rossi']),
    widget('GrantList', 'current grants by name',
        () => ({ status: 'current', sort_by: 'name', order: 'asc' }),
        () => ['Example PRIN']),

    // SeminarList
    widget('SeminarList', 'seminars in a date range',
        () => ({ from: isoDay(-30), to: isoDay(30), _sort: 'startDatetime', _limit: '10' }),
        fx => [fx.seminars.upcoming.title, fx.seminars.past.title, 'Ivanov']),
    widget('SeminarList', 'upcoming seminars of a category',
        fx => ({ category: id(fx.category), from: isoDay(), _sort: 'startDatetime' }),
        fx => [fx.seminars.upcoming.title], fx => [fx.seminars.past.title]),
    widget('SeminarList', 'all seminars of a category grouped by year',
        fx => ({ category: id(fx.category), group_by_year: '1', _sort: '-startDatetime' }),
        fx => [fx.seminars.upcoming.title]),
    widget('SeminarList', 'seminars funded by a grant grouped by year',
        fx => ({ grants: id(fx.grant), _sort: '-startDatetime', group_by_year: '1' }),
        fx => [fx.seminars.upcoming.title]),

    // ConferenceList
    widget('ConferenceList', 'conferences in a date range',
        () => ({ from: isoDay(), to: isoDay(60), _sort: 'startDate', _limit: '5' }),
        fx => [fx.conference.title]),
    widget('ConferenceList', 'research (non outreach) conferences',
        () => ({ is_outreach: 'false', from: isoDay(-30), to: isoDay(60), _sort: 'startDate', _limit: '5' }),
        fx => [fx.conference.title]),
    widget('ConferenceList', 'conferences funded by a grant grouped by year',
        fx => ({ grants: id(fx.grant), _sort: 'startDate', group_by_year: '1' }),
        fx => [fx.conference.title]),

    // ThesisList
    widget('ThesisList', 'theses of an SSD at an institution by date',
        fx => ({ ssd: 'MATH-02/A', institution: id(fx.institutions.pisa), sort_by: 'date', order: 'desc' }),
        fx => [fx.thesis.title, 'Neri']),
    widget('ThesisList', 'theses of an SSD excluding an institution',
        fx => ({ ssd: 'MATH-02/A', exclude_institution: id(fx.institutions.abroad), sort_by: 'name', order: 'asc' }),
        fx => [fx.thesis.title]),
    widget('ThesisList', 'theses at an institution excluding a qualification, grouped by year',
        fx => ({ exclude_qualification: 'PO', institution: id(fx.institutions.pisa), group_by_year: '1' }),
        fx => [fx.thesis.title]),

    // CourseList
    widget('CourseList', 'PhD courses of a programme in a period',
        () => ({ from: isoDay(-30), to: isoDay(60), phd: 'Matematica' }),
        fx => [fx.course.title, 'Rossi']),

    // Home page widgets
    widget('HomeEventList', 'next seminars and conferences', () => ({}),
        fx => [fx.seminars.upcoming.title, fx.conference.title]),
    widget('HomeVisitList', 'current and future visitors', () => ({ default_entries: '5' }),
        () => ['Ivanov']),
    widget('HomeGrantList', 'recent grants', () => ({}),
        fx => [fx.grant.name]),
    widget('EventList', 'seminars and conferences from a date', () => ({ from: isoDay(), _limit: '10' }),
        fx => [fx.seminars.upcoming.title, fx.conference.title]),

    // Detail pages: the id comes from the page query string.
    widget('Seminar', 'seminar page', fx => ({ id: id(fx.seminars.upcoming) }),
        fx => [fx.seminars.upcoming.title, 'Ivanov', 'Aula Magna']),
    widget('Conference', 'conference page', fx => ({ id: id(fx.conference) }),
        fx => [fx.conference.title]),
    widget('Grant', 'grant page', fx => ({ grant_id: id(fx.grant) }),
        fx => [fx.grant.name, 'Rossi', 'Bianchi']),
    widget('Course', 'PhD course page', fx => ({ phd_course_id: id(fx.course) }),
        fx => [fx.course.title, 'Rossi']),
    widget('PersonDetails', 'personal page (scheda personale)', fx => ({ person_id: id(fx.people.alice) }),
        fx => ['Rossi', fx.council.name, fx.grant.name]),
]

module.exports = { contracts }
