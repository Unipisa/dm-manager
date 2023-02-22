const { 
    model, 
    Schema, 
    ObjectId, 
    date,
    SSD,
    notes,
    createdBy, 
    updatedBy,
} = require('./Model')

const thesisSchema = new Schema({
    person: { type: ObjectId, label: 'persona', ref: 'Person', required: true},
    title: { type: String, label: 'titolo', default: ''},
    advisors: [{ type: ObjectId, label: 'relatori', ref: 'Person' }],
    date,
    institution: { type: String, label: 'istituto', default: ''},
    fileUrl: {type: String, label: 'URL file'},
    SSD,
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Thesis = model('Thesis', thesisSchema)

const Person = require('./Person')

Person.relatedModels.push({
    model: Thesis,
    modelName: 'Thesis',
    url: 'thesis',
    field: 'person',
}, {
    model: Thesis,
    modelName: 'Thesis',
    url: 'thesis',
    field: 'supervisors',
    multiple: true,
})

module.exports = Thesis
