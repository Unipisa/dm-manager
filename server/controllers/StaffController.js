const Staff = require('../models/Staff')
const Controller = require('./Controller')
const RoomAssignment = require('../models/RoomAssignment')

class StaffController extends Controller {
    constructor() {
        super(Staff)
        this.path = 'staff'
        this.managerRoles.push('staff-manager')
        this.supervisorRoles.push('staff-manager', 'staff-supervisor')
        this.searchFields = [ 'qualification', 'person.lastName', 'person.firstName', 'person.affiliations.name']

        // inserisce tutte le assegnazioni
        // stanze
        this.queryPipeline.push(...RoomAssignment.personRoomAssignmentPipeline())
//        this.indexPipeline = [
//            {
//                $lookup: {
//                    from: "people",
//                    localField: "person",
//                    foreignField: "_id",
//                    as: "person",
//                    pipeline: [
//                        { $project: { firstName: 1, lastName: 1, affiliations: 1 } },
//                        {
//                            $lookup: {
//                                from: "institutions",
//                                localField: "affiliations",
//                                foreignField: "_id",
//                                as: "affiliations",
//                                pipeline: [
//                                    { $project: { name: 1 } }
//                               ]
//                            }
//                        },
//                        { $sort: { lastName: 1 } },
//                    ]
//                }
//            },
//            {
//                $unwind: {
//                    path: "$person",
//                   preserveNullAndEmptyArrays: true
//                }
//            },
//           ...RoomAssignment.personRoomAssignmentPipeline()
//        ]
    }
}

module.exports = StaffController
