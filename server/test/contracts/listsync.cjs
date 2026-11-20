// listsync: keeps mailing lists in sync. The "collaboratori" source in
// config.ini is a json module reading data.person.email from this URL,
// with its api_key sent as a bearer token.

const assert = require('node:assert/strict')

const contracts = [
    {
        name: 'current collaborators with their email',
        roles: ['staff-supervisor'],
        path: () => '/api/v0/staff?_sort=person&qualification__in=Collaboratore&startDate__lt_or_null=today&endDate__gt_or_null=today',
        check(body, fx) {
            assert.deepEqual(body.data.map(staff => staff.person.email), [fx.people.bruno.email])
        },
    },
]

module.exports = { contracts }
