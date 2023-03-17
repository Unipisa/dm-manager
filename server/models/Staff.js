const { 
    model, 
    Schema, 
    ObjectId, 
    startDate, 
    endDate,
    SSD, 
    createdBy, 
    updatedBy,
} = require('./Model')

const staffSchema = new Schema({
    person: { type: ObjectId, label: 'persona', ref: 'Person' },
    matricola: { type: String, label: 'matricola'},
    qualification: {type: String, label: 'qualifica', 
        enum: [
            'PO', 'PA', 'RIC', 'RTDb', 'RTDa', 
            'Assegnista', 'Dottorando', 'PTA', 
            'Professore Emerito',
            'Collaboratore',
            'Docente Esterno',
            'Dottorando Esterno',
            'Personale in quiescenza',
        ]},
    isInternal: {type: Boolean, label: 'interno al dipartimento', default: true},
    startDate,
    endDate,
    SSD,
    photoUrl: {type: String, label: 'URL foto'},
    wordpressId: String,
    cn_ldap: {type: String, label: 'cn_ldap'},
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
        let: { start: new Date(), end: new Date() },
        localField: 'person._id',
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
