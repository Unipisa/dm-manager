const Controller = require('../Controller')
const Staff = require('../../models/Staff')
const { personRoomAssignmentPipeline } = require('../../models/RoomAssignment')

const controller = new Controller()
controller.Model = Staff
controller.path = 'public/staff-list'
controller.fields = Object.fromEntries([
    'person', 'qualification', 'isInternal', 'startDate', 'endDate', 'SSD',
].map(field => [field, Staff._schema_info.properties[field]]))
controller.searchFields = ['qualification', 'person.lastName', 'person.firstName', 'person.affiliations.name']
controller.queryPipeline = [
    { $lookup: {
        from: 'people', localField: 'person', foreignField: '_id', as: 'person',
        pipeline: [{ $project: {
            firstName: 1, lastName: 1, email: 1, phone: 1, affiliations: 1,
        } }],
    } },
    { $unwind: { path: '$person', preserveNullAndEmptyArrays: true } },
    ...personRoomAssignmentPipeline(),
    { $lookup: {
        from: 'institutions', localField: 'person.affiliations', foreignField: '_id', as: 'person.affiliations',
        pipeline: [{ $project: { name: 1 } }],
    } },
    { $project: {
        person: 1, qualification: 1, isInternal: 1, startDate: 1, endDate: 1,
        SSD: 1, 'roomAssignment.room': 1,
    } },
]

async function staffListQuery(req, res) {
    return controller.performQuery({ _sort: 'person', ...req.query }, res)
}

module.exports = staffListQuery
