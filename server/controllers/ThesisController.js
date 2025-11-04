const Thesis = require('../models/Thesis')
const Controller = require('./Controller')

class ThesisController extends Controller {
    constructor() {
        super(Thesis)
        this.path = 'thesis'
        this.managerRoles.push('thesis-manager')
        this.supervisorRoles.push('thesis-manager', 'thesis-supervisor')
        this.searchFields = ['title', 'SSD', 'date', 'person.lastName', 'person.firstName' ]
//        this.indexPipeline = [
//            {
//                $lookup: {
//                    from: "people",
//                    localField: "person",
//                    foreignField: "_id",
//                    as: "person",
//                    pipeline: [
//                        { $project: { firstName: 1, lastName: 1 } },
//                        { $sort: { lastName: 1 } },
//                    ]
//                }
//            },
//            {
//                $unwind: {
//                    path: "$person",
//                    preserveNullAndEmptyArrays: true
//                }
//            }
//        ]
    }
}

module.exports = ThesisController