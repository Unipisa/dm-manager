const Visit = require('../models/Visit')
const Controller = require('./Controller')
const RoomAssignment = require('../models/RoomAssignment')

class VisitController extends Controller {
    constructor() {
        super(Visit)
        this.path = 'visit'
        this.managerRoles.push('visit-manager')
        this.supervisorRoles.push('visit-manager', 'visit-supervisor')
        this.searchFields = [ 'person.lastName', 'person.firstName', 'affiliations.name' ]

        // inserisce tutte le assegnazioni
        // stanze
        this.queryPipeline.push(...RoomAssignment.personRoomAssignmentPipeline())
        this.indexPipeline = [
            {
                $lookup: {
                    from: "people",
                    localField: "person",
                    foreignField: "_id",
                    as: "person",
                    pipeline: [
                        { $project: { firstName: 1, lastName: 1 } },
                        { $sort: { lastName: 1 } },
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
                from: "institutions",
                localField: "affiliations",
                foreignField: "_id",
                as: "affiliations",
                pipeline:[{$project:{name : 1}}]
                }
            },
            ...RoomAssignment.personRoomAssignmentPipeline()
        ]
    }
}

module.exports = VisitController
