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
            'Collaboratore e Docente Esterno',
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
