const Visit = require('../models/Visit')
const Controller = require('./Controller')

class VisitController extends Controller {
    constructor() {
        super(Visit)
        this.path = 'visit'
        this.populate_fields = [{path: 'person', select: ['firstName', 'lastName', 'affiliation', 'email']}]
        this.managerRoles.push('visit-manager')
        this.supervisorRoles.push('visit-manager', 'visit-supervisor')
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

module.exports = VisitController