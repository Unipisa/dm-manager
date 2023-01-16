const Visit = require('../models/Visit')
const Controller = require('./Controller')

class VisitController extends Controller {
    constructor() {
        super(Visit)
        this.path = 'visit'
        this.managerRoles.push('visit-manager')
        this.supervisorRoles.push('visit-manager', 'visit-supervisor')
        this.searchFields = [ 'affiliation' ]

        // inserisce tutte le assegnazioni
        // stanze
        this.queryPipeline.push(
            {$lookup: {
                from: "roomassignments",
                let: { start: "$startDate", end: "$endDate" },
                localField: 'person._id',
                foreignField: "person",
                as: 'roomAssignments',
                pipeline: [
                    // inserisce i dati della stanza
                    {$lookup: {
                        from: "rooms",
                        localField: "room",
                        foreignField: "_id",
                        as: "room",
                    }},
                    {$project: {
                        "startDate": 1,
                        "endDate": 1,
                        "room._id": 1,
                        "room.building": 1,
                        "room.floor": 1,
                        "room.number": 1,
                    }},
                    // tiene solo le assegnazioni che includono la data odierna 
                    {$match: {
                        $expr: {
                            $and: [
                                { $lte: ["$startDate", "$$end"],},
                                { $gte: ["$endDate", "$$start"], }
                            ]},
                        },
                    },
                    {$unwind: {
                        path: "$room",
                        preserveNullAndEmptyArrays: true
                    }},
                    // ordina per data finale...
                    // l'ultima assegnazione dovrebbe essere quella attuale
                    {$sort: {"endDate": 1}},
                ]
            }},
            { $addFields: {
                roomAssignment: {
                    $ifNull: [
                        { $arrayElemAt: ["$roomAssignments", -1] },
                        null
                    ]
                }
            }}
        )
    }
}

module.exports = VisitController
