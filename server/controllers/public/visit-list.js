const { personProfilePipeline } = require('./person-profile')
const Controller = require('../Controller')
const Visit = require('../../models/Visit')
const { personRoomAssignmentPipeline } = require('../../models/RoomAssignment')

// Reuse the legacy visit query syntax, exposing only the public table fields.
const controller = new Controller()
controller.Model = Visit
controller.path = 'public/visit-list'
controller.fields = Object.fromEntries([
    'person', 'affiliations', 'startDate', 'endDate', 'SSD', 'tags',
    'publish', 'collaborationTheme', 'grants',
].map(field => [field, Visit._schema_info.properties[field]]))
controller.searchFields = ['person.lastName', 'person.firstName', 'affiliations.name']
controller.queryPipeline = [
    { $lookup: {
        from: 'people', localField: 'person', foreignField: '_id', as: 'person',
        pipeline: [...personProfilePipeline(), { $project: {
            firstName: 1, lastName: 1, email: 1, phone: 1, affiliations: 1, hasPersonProfile: 1,
        } }],
    } },
    { $unwind: { path: '$person', preserveNullAndEmptyArrays: true } },
    ...personRoomAssignmentPipeline(),
    ...['affiliations', 'person.affiliations'].map(field => ({ $lookup: {
        from: 'institutions', localField: field, foreignField: '_id', as: field,
        pipeline: [{ $project: { name: 1 } }],
    } })),
    { $project: {
        person: 1, affiliations: 1, startDate: 1, endDate: 1,
        SSD: 1, tags: 1, publish: 1, collaborationTheme: 1,
        'roomAssignment.room': 1,
    } },
]

async function visitListQuery(req, res) {
    return controller.performQuery({ _sort: 'person', ...req.query }, res)
}

module.exports = visitListQuery
