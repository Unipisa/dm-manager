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

const thesisSchema = new Schema({
    person: { type: ObjectId, label: 'persona', ref: 'Person', required: true},
    title: { type: String, label: 'titolo', default: ''},
    supervisors: [{ type: ObjectId, label: 'supervisori', ref: 'Person' }],
    startDate,
    endDate,
    institution: { type: String, label: 'affiliazione', default: ''},
    fileUrl: {type: String, label: 'URL file'},
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
