const EventSeminar = require('../models/EventSeminar.js')
const Controller = require('./Controller.js')

class EventSeminarController extends Controller {
    constructor() {
        super(EventSeminar)
        this.path = 'event-seminar'
        this.managerRoles.push('event-seminar-manager')
        this.supervisorRoles.push('event-seminar-manager', 'event-seminar-supervisor')

        this.searchFields = ['title', 'startDatetime', 'speakers.firstName', 'speakers.lastName', 'category.name' ]
        this.indexPipeline = [
            {
                $lookup: {
                    from: "people",
                    localField: "speakers",
                    foreignField: "_id",
                    as: "speakers",
                    pipeline: [
                        { $project: { firstName: 1, lastName: 1 } },
                        { $sort: { lastName: 1 } },
                    ]
                }
            },
            {
                $lookup: {
                    from: "seminarcategories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [
                        { $project: { name: 1, label: 1 } }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]
    }
}

module.exports = EventSeminarController
