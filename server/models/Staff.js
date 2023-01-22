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
    jobId: { type: String, label: 'UNIPI id'},
    qualification: {type: String, label: 'qualifica', 
        enum: [
            'PO', 'PA', 'RIC', 'RTDb', 'RTDa', 
            'Assegnista', 'Dottorando', 'PTA', 
            'Collaboratore e Docente Esterno',
            'Professore Emerito',
        ]},
    startDate,
    endDate,
    SSD,
    publish: {type: Boolean, label: 'pubblica sul web', default: true},
    wordpressId: String,
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
