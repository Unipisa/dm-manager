const Grant = require('../models/Grant')
const Controller = require('./Controller')

class GrantController extends Controller {
    constructor() {
        super(Grant)
        this.path = 'grant'
        this.managerRoles.push('grant-manager')
        this.supervisorRoles.push('grant-manager', 'grant-supervisor')
    }

    async public(req, res) {
        try {
            let today = new Date()
            let tomorrow = today
            tomorrow.setDate(today.getDate() + 1)
            let visits = await Visit.find({
                startDate: {$lte: tomorrow},
                endDate: {$gte: today}
            })
            const data = visits.map(visit => ({
                startDate: visit.startDate,
                endDate: visit.endDate,
                firstName: visit.firstName,
                lastName: visit.lastName,
                affiliation: visit.affiliation,
                roomNumber: visit.roomNumber,
                building: visit.building,               
            }))
            res.send({
                data,
                visits: data // backward compatibility
            })
        } catch(err) {
            res.status("500")
            res.send({ error: err.message })
        }
    }

    register(router) {
        let paths = super.register(router)

        paths.push(`get /public/${this.path}`)
        router.get(`/public/${this.path}/`, 
            (req, res) => this.public(req,res))
        return paths
    }
}

module.exports = GrantController