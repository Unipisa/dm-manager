// listsync: keeps mailing lists in sync. The "collaboratori" source in
// config.ini is a json module reading data.person.email from a URL, sending
// its api_key (if set) as a bearer token.
//
// listsync does not check the HTTP status: an error response yields no
// emails, and the mailing list would be emptied.

const assert = require('node:assert/strict')

const contracts = [
    {
        name: 'current collaborators with their email (public staff list, no token)',
        roles: null,
        path: () => '/api/v0/public/staff-list?qualification=Collaboratore&startDate__lte_or_null=today&endDate__gte_or_null=today',
        check(body, fx) {
            assert.deepEqual(body.data.map(staff => staff.person.email), [fx.people.bruno.email])
        },
    },
    // Configuration in use until the source is switched to the URL above.
    {
        name: 'current collaborators with their email (generic staff endpoint, token)',
        roles: ['staff-supervisor'],
        path: () => '/api/v0/staff?_sort=person&qualification__in=Collaboratore&startDate__lt_or_null=today&endDate__gt_or_null=today',
        check(body, fx) {
            assert.deepEqual(body.data.map(staff => staff.person.email), [fx.people.bruno.email])
        },
    },
]

module.exports = { contracts }
