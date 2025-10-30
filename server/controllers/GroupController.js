const Group = require('../models/Group')
const Controller = require('./Controller')

class GroupController extends Controller {
    constructor() {
        super(Group)
        this.path = 'group'
        this.managerRoles.push('group-manager')
        this.supervisorRoles.push('group-manager', 'group-supervisor')
        this.searchFields = [ 'members.lastName', 'members.firstName', 'name' ]
        this.indexPipeline = [
            {
                $lookup: {
                from: "people",
                localField: "members",
                foreignField: "_id",
                as: "members",
                pipeline: [
                    { $project: { firstName: 1, lastName: 1 } },
                    { $sort: { lastName: 1 } },
                ]}
            }
        ]
    }
}

module.exports = GroupController
