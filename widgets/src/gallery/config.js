// Edit preview values here. These are widget props, not raw API query strings.
const sampleIds = {
    seminar: '69f1ba20fd916392f8c014b5',
    grant: '69e46f9584f0900654e893af',
    person: '63822bbf7942943d6350d692',
    group: '69e873bd1fe35a92793f027c',
    institution: '641b8b0b840928dc5b8da2e3',
};

const dateRange = [
    ['from', 'API · ISO date or "now". Seminars: start on/after this date; conferences and courses: end on/after this date.'],
    ['to', 'API · ISO date or "now". Start on/before this date.'],
];
const sortAndLimit = [
    ['_sort', 'API · Field name; prefix with - for descending order.'],
    ['_limit', 'API · Positive integer, maximum number of records per request.'],
];
const tableOptions = [
    ['fields', 'Comma-separated fields to display, including dotted paths such as person.lastName.'],
    ['table / tableen', 'Comma-separated column headings in Italian / English.'],
    ['date_format', 'PHP-style date format, e.g. d.m.Y. People and grant lists use a fixed English date format.'],
    ['no_data_message / no_data_message_en', 'Empty-result message in Italian / English.'],
];
const filterSyntax = [
    ['filter', 'Comma-separated terms: current, past, perspective, year=YYYY, dateyear=YYYY, or key=value. Terms are combined; later terms overwrite earlier values for the same key.'],
    ['current / past / perspective', 'Inside filter: current includes today (open date boundaries allowed); past means endDate < today; perspective means startDate > today. For records with startDate/endDate.'],
    ['year=YYYY / dateyear=YYYY', 'Inside filter: year selects periods overlapping the year; dateyear selects a date within the year. Use year for staff, visits and grants; dateyear for theses.'],
    ['_search / _limit / _direction', 'Inside filter: _search=text, _limit=N, _direction=1 or -1. Search fields depend on the public route.'],
    ['date modifiers', 'Date fields accept __lt, __gt, __lte, __gte, __lt_or_null, __gt_or_null, __lte_or_null, __gte_or_null. Values: ISO date or today.'],
    ['text modifiers', 'Text fields accept __regex (case insensitive), __in (values separated by |), __ne. Boolean fields accept 1, yes, true as true; other values are false.'],
    ['relation modifiers', 'Relation fields accept a single ID or __ne=ID, including fields holding lists of relations.'],
];
const peopleFields = 'person.firstName,person.lastName';
const roomFields = 'roomAssignment.room.building,roomAssignment.room.floor,roomAssignment.room.number';
const thesisTableFilters = [
    ['filter fields', 'Inside filter: person, title, advisors, date, institutions, fileUrl, SSD. Names and capitalization must match the API.'],
    ['sort_field', 'person (default), title, date, fileUrl, SSD; prefix with - for descending. Sent as _sort.'],
    ...filterSyntax,
];
const thesisTableOptions = [...tableOptions, ['list_mode', 'Render a plain list instead of a table. Any truthy value except "0" enables it.']];

// Each entry documents the props accepted by its component, including fixed query
// behavior where the public route supports filters the widget does not expose.
export const widgets = [
    {
        id: 'eventlist', component: 'EventList', props: { _limit: 2 },
        routes: ['public/conferences', 'public/seminars'],
        filters: [...dateRange,
            ['grants', 'API · Grant ID; applies to conferences only. The seminars endpoint expects singular grant, which EventList does not expose.'],
            ['_limit', 'API · Limit per endpoint, not the combined result.'],
        ],
        options: [['en', 'Force English labels (boolean).']],
        notes: 'Conferences use _sort=startDate and seminars _sort=startDatetime; the combined list is then sorted by date.',
    },
    {
        id: 'seminarlist', component: 'SeminarList',
        props: { from: '2021-01-01', _sort: 'startDatetime', _limit: 10 },
        routes: ['public/seminars'],
        filters: [...dateRange, ['category', 'API · Seminar category ID.'], ['grant', 'API · Grant ID.'], ...sortAndLimit],
        notes: 'The route also accepts externalid, but SeminarList does not expose it as a prop.',
    },
    {
        id: 'seminar', component: 'Seminar', props: { id: sampleIds.seminar },
        routes: ['public/seminar/:id'], filters: [['id', 'Required seminar ID, inserted into the route. No query filters.']],
    },
    {
        id: 'conferencelist', component: 'ConferenceList',
        props: { from: '2021-01-01', _limit: 50, is_outreach: true },
        routes: ['public/conferences'],
        filters: [...dateRange, ['grants', 'API · Grant ID.'], ['ssd', 'API · Research area code (case-sensitive value).'],
            ['is_outreach', 'API · true or false; omit to include both.'], ...sortAndLimit],
    },
    {
        id: 'conference', component: 'Conference', props: {},
        lookup: { route: 'public/conferences', query: '_limit=1', prop: 'id' },
        routes: ['public/conference/:id'], filters: [['id', 'Required conference ID, inserted into the route. No query filters.']],
        notes: 'This preview selects the first available local conference using GET /api/v0/public/conferences?_limit=1. Set props.id to use a specific conference instead.',
    },
    {
        id: 'stafflist', component: 'StaffList',
        props: {
            fields: `${peopleFields},qualification,SSD_name,${roomFields},person.email`,
            table: 'Nome,Cognome,Qualifica,Gruppo di ricerca,Edificio,Piano,Stanza,Email',
            tableen: 'First Name,Last Name,Qualification,Research Group,Building,Floor,Office,Email',
            sort_field: 'person', filter: 'current',
        },
        routes: ['public/staff-list'],
        filters: [
            ['filter fields', 'Inside filter: person, qualification, isInternal, startDate, endDate, SSD.'],
            ['sort_field', 'person (default), qualification, isInternal, startDate, endDate; prefix with - for descending. Sent as _sort.'],
            ...filterSyntax,
        ],
        options: tableOptions,
        notes: 'Search covers qualification, person.firstName, person.lastName and person.affiliations.name.',
    },
    {
        id: 'visitlist', component: 'VisitList',
        props: {
            fields: `${peopleFields},affiliations,${roomFields},startDate,endDate`,
            table: 'First Name,Last Name,Affiliation,Building,Floor,Office,From,To',
            sort_field: 'person', filter: 'past',
        },
        routes: ['public/visit-list'],
        filters: [
            ['filter fields', 'Inside filter: person, affiliations, startDate, endDate, SSD, publish, collaborationTheme. tags is returned but cannot be filtered.'],
            ['sort_field', 'person (default), startDate, endDate, SSD, publish, collaborationTheme; prefix with - for descending. Sent as _sort.'],
            ...filterSyntax,
        ],
        options: tableOptions,
        notes: 'Search covers person.firstName, person.lastName and affiliations.name.',
    },
    {
        id: 'persondetails', component: 'PersonDetails', props: { person_id: sampleIds.person },
        routes: ['public/person/:id', 'public/unimap/:matricola'],
        filters: [['person_id', 'Required person ID, inserted into the person route. No query filters.']],
        notes: 'Unimap data is requested only if a staff matricola is available in the person response.',
    },
    {
        id: 'personcard', component: 'PersonCard', props: { person_id: sampleIds.person, badge: 'Example badge' },
        routes: ['public/person/:id'],
        filters: [['person_id', 'Required person ID, inserted into the route. No query filters.']],
        options: [['badge', 'Optional text displayed on the card.']],
    },
    {
        id: 'groupcards', component: 'GroupCards', props: { group_id: sampleIds.group },
        routes: ['public/group/:id'],
        filters: [['group_id', 'Required group ID, inserted into the route.'],
            ['isinternal', 'Local · 1 or "1" for internal members, 0 or "0" for external members; omit to show all. Also applies to chair and deputy.']],
    },
    {
        id: 'courselist', component: 'CourseList',
        props: { from: '2024-01-01', to: '2026-01-01', phd: 'HPSC', show_activation_filter: true },
        routes: ['public/courses'],
        filters: [...dateRange, ['phd', 'API · PhD programme, e.g. HPSC.'],
            ['show_activation_filter', 'Local · Show the All / Confirmed control (boolean, default false). Confirmed checks activationStatus=confirmed.']],
    },
    {
        id: 'thesislist', component: 'ThesisList',
        props: { institution: sampleIds.institution, exclude_qualification: 'Dottorando Esterno' },
        routes: ['public/theses'],
        filters: [
            ['year', 'API · Thesis year (YYYY).'], ['ssd', 'API · Research area code.'], ...sortAndLimit,
            ['institution', 'Local · Institution ID; matches any institution on the thesis.'],
            ['qualification', 'Local · Include students with this staff qualification.'],
            ['exclude_qualification', 'Local · Exclude students with this staff qualification.'],
        ],
        notes: 'Default mode groups theses by year. Supplying any table option (including filter or sort_field) switches to the table/list mode documented in the Thesis table/list preview; yearly props then no longer apply.',
    },
    {
        id: 'thesistable', component: 'ThesisList',
        props: {
            fields: `${peopleFields},person.genealogyId,title,advisors,institutions,date`,
            table: 'Nome,Cognome,Genealogia,Titolo,Relatori,Istituzioni,Data',
            tableen: 'First Name,Last Name,Genealogy,Title,Supervisors,Institutions,Date',
            sort_field: 'person',
        },
        additionalPreviews: [{ target: 'thesisplainlist', props: { list_mode: true, sort_field: 'person' } }],
        routes: ['public/theses?_format=shortcode'],
        filters: thesisTableFilters, options: thesisTableOptions,
        notes: 'Both examples use ThesisList in table/list mode. Search covers title, person.firstName, person.lastName and institutions.name. Date shortcuts using startDate/endDate are not supported here; use dateyear or date modifiers.',
    },
    {
        id: 'grantlist', component: 'GrantList', props: { sort_field: 'startDate', filter: 'current' },
        routes: ['public/grants?_format=shortcode'],
        filters: [
            ['filter fields', 'Inside filter: name, identifier, CUP, projectType, funds, fundingEntity, pi, localCoordinator, members, startDate, endDate, SSD, webSite, budgetAmount, description.'],
            ['sort_field', 'startDate (default), endDate, name, identifier, CUP, projectType, funds, fundingEntity, pi, localCoordinator, webSite, budgetAmount, description; prefix with - for descending. Sent as _sort.'],
            ...filterSyntax,
        ],
        options: tableOptions.filter(([key]) => !['fields', 'table / tableen'].includes(key)),
        notes: 'Search covers name, pi.lastName and localCoordinator.lastName.',
    },
    {
        id: 'grant', component: 'Grant', props: { grant_id: sampleIds.grant },
        routes: ['public/grant/:id'], filters: [['grant_id', 'Required grant ID, inserted into the route. No query filters.']],
    },
    {
        id: 'homeeventlist', component: 'HomeEventList', props: { default_entries: 3, show_excerpt: false },
        routes: ['public/conferences', 'public/seminars'], filters: [],
        options: [['default_entries', 'Initially shows twice this number; Load more adds this number (default 3).'],
            ['show_excerpt', 'Show the abstract/description excerpt (boolean, default true).'], ['en', 'Force English labels (boolean).']],
        notes: 'No configurable API filters. Uses from=today, a limit based on visible entries, and chronological sorting. A separate seminars request selects the configured colloquium category. The UI filters All / Conferences / Seminars / Colloquia locally. columns, columns_md and columns_lg are not supported props.',
    },
    {
        id: 'homegrantlist', component: 'HomeGrantList', props: { default_entries: 1 },
        routes: ['public/grants'], filters: [],
        options: [['default_entries', 'Initially shows twice this number; Load more adds this number (default 3).']],
        notes: 'No configurable API filters. Uses from=today, then sorts by budget and limits the displayed list locally.',
    },
    {
        id: 'homevisitlist', component: 'HomeVisitList', props: { default_entries: 5 },
        routes: ['public/visits'], filters: [],
        options: [['default_entries', 'Initial number of visits per tab and Load more increment (default 10).']],
        notes: 'No configurable API filters. Makes current and future=true requests, with _sort=startDate and a limit based on visible entries. Current / Future tabs filter the combined data locally.',
    },
];
