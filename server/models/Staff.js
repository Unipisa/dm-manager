const { 
    model, 
    Schema, 
    ObjectId, 
    startDate, 
    endDate,
    multipleSSDs, 
    createdBy, 
    updatedBy,
} = require('./Model')

const staffSchema = new Schema({
    person: { type: ObjectId, label: 'persona', ref: 'Person' },
    matricola: { type: String, label: 'matricola'},
    qualification: {type: String, label: 'qualifica', 
        enum: [
            'PO', 'PA', 'RIC', 'RTDb', 'RTDa', 'RTT',
            'Assegnista', 'Dottorando in Matematica', 'Dottorando in HPSC',
            'PTA', 
            'Professore Emerito',
            'Collaboratore',
            'Docente Esterno', 'Docente Esterno Dottorato HPSC',
            'Dottorando Esterno',
            'Personale in quiescenza',
            'ex Docente',
        ]},
    isInternal: {type: Boolean, label: 'interno al dipartimento', default: true},
    startDate,
    endDate,
    SSD: multipleSSDs,
    // 09/04/2025: hiding as not used anymore, CDP
    // photoUrl: {type: String, label: 'URL foto'},
    // wordpressId: String,
    notes: {type: String, label: 'note', widget: 'text'},
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Staff = model('Staff', staffSchema)

const Person = require('./Person')

Person.relatedModels.push({
    model: Staff,
    modelName: 'Staff',
    url: 'staff',
    field: 'person',
})

module.exports = Staff

Staff.personStaffPipeline = () => ([
    {$lookup: {
        from: "staffs",
        let: { start: { $toDate: "$$NOW" }, end: { $toDate: "$$NOW" } },
        localField: '_id',
        foreignField: "person",
        as: 'staffs',
        pipeline: [
            // tiene solo le attribuzioni che includono il periodo [start, end] 
            {$match: {
                $expr: {
                    $and: [
                        { $or: [
                            { $eq: ["$$end", null] },
                            { $eq: ["$startDate", null] },
                            { $lte: ["$startDate", "$$end"] } ]},
                        // FIXME: The following part of the query does not appear to work
                        { $or: [
                            { $eq: ["$$start", null] },
                            { $eq: ["$endDate", null] },
                            { $gte: ["$endDate", "$$start"] } ]}
                    ]},
                },
            },
            // ordina per data finale...
            // l'ultima assegnazione dovrebbe essere quella attuale
            {$sort: {"endDate": 1}},
        ]
    }},
    { $addFields: {
        staff: {
            $ifNull: [
                { $arrayElemAt: ["$staffs", -1] },
                null
            ]
        }
    }}
])
