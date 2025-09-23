const Group = require('../models/Group')
const Controller = require('./Controller')

const indexPipeline =
    [{
        $lookup: {
        from: "people",
        localField: "members",
        foreignField: "_id",
        as: "members",
        pipeline: [
            { $project: { firstName: 1, lastName: 1 } },
            { $sort: { lastName: 1 } },
        ]}}
]

class GroupController extends Controller {
    constructor() {
        super(Group)
        this.path = 'group'
        this.managerRoles.push('group-manager')
        this.supervisorRoles.push('group-manager', 'group-supervisor')
        this.searchFields = [ 'members.lastName', 'members.firstName', 'affiliation', 'name' ]
    }

    async search(req, res) {
        //console.log(`*** SEARCH ${req.path} ${JSON.stringify(req.query.q)}`)
        return this.performQuery({_search: req.query.q || ''}, res,  {queryPipeline: indexPipeline})
    }

    async index (req, res) {
        //console.log(`*** INDEX ${req.path} ${JSON.stringify(req.query)}`)
        return this.performQuery(req.query, res,  {queryPipeline: indexPipeline})
    }
}

module.exports = GroupController
