const Grant = require('../models/Grant')
const Controller = require('./Controller')

class GrantController extends Controller {
    constructor() {
        super(Grant)
        this.path = 'grant'
        this.managerRoles.push('grant-manager')
        this.supervisorRoles.push('grant-manager', 'grant-supervisor')
        this.searchFields = ['name', 'identifier', 'projectType', 'pi.lastName', 'pi.firstName']
        this.searchRoles.push('visit-manager', 'grant-manager', 'grant-supervisor')
//        this.indexPipeline = [
//            {
//                $lookup: {
//                    from: "people",
//                    localField: "pi",
//                    foreignField: "_id",
//                    as: "pi",
//                    pipeline: [
//                        { $project: { firstName: 1, lastName: 1 } },
//                        { $sort: { lastName: 1 } },
//                    ]
//                }
//            },
//            {
//                $unwind: {
//                    path: "$pi",
//                    preserveNullAndEmptyArrays: true
//                }
//            }
//        ]
    }
}

module.exports = GrantController