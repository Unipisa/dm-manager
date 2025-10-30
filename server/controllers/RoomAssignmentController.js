const RoomAssignment = require('../models/RoomAssignment')
const Controller = require('./Controller')

class RoomAssignmentController extends Controller {
    constructor() {
        super(RoomAssignment)
        this.path = 'roomAssignment'
        this.managerRoles.push('assignment-manager')
        this.supervisorRoles.push('assignment-manager', 'assignment-supervisor')
        this.searchFields = ['room.code', 'person.lastName', 'person.firstName']
        this.indexPipeline = [
            {
                $lookup: {
                    from: "people",
                    localField: "person",
                    foreignField: "_id",
                    as: "person",
                    pipeline: [
                        { $project: { firstName: 1, lastName: 1 } },
                        { $sort: { lastName: 1 } }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$person",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "rooms",
                    localField: "room",
                    foreignField: "_id",
                    as: "room",
                    pipeline: [
                        { $project: { code: 1 } }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$room",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]
    }
}

module.exports = RoomAssignmentController