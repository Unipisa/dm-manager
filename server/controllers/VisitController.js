const Visit = require('../models/Visit')
const Controller = require('./Controller')

class VisitController extends Controller {
    constructor() {
        super()
        this.path = 'visit'
        this.managerRoles.push('visit-manager')
        this.supervisorRoles.push('visit-manager', 'visit-supervisor')
        this.Model = Visit
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
        super.register(router)

        router.get(`/public/${this.path}/`, 
            (req, res) => this.public(req,res))       
    }
}

module.exports = VisitController