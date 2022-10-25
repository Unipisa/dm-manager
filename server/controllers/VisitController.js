const Visit = require('../models/Visit')
const Controller = require('./Controller')

class VisitController extends Controller {
    constructor() {
        super()
        this.path = 'visit'
        this.managerRoles.push('visit-manager')
        this.supervisorRoles.push('visit-manager', 'visit-supervisor')
        this.Model = Visit
        this.fields = {
            'startDate': {
                can_sort: true,
            },
            'endDate': {
                can_sort: true,
            },
            'lastName': {
                can_sort: true,
                can_filter: true,
            },
            'firstName': {
                can_sort: true,
                can_filter: true,
            },
            'invitedBy': {
                can_sort: true,
                can_filter: true,
            },
            'updatedAt': {
                can_sort: true,
            },
            'createdAt': {
                can_sort: true,
            },
        }
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