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

const visitSchema = new Schema({
    person: { type: ObjectId, label: 'visitatore', ref: 'Person' },
    affiliation: {type: String, label: 'affiliazione'},
    country: {type: String, label: 'nazione'},
    startDate,
    endDate,
    referencePeople: [{ type: ObjectId, label: 'referenti', ref: 'Person' }],
    fundingAgency: {type: String, label: 'ente finanziatore'},
    grants: [{type: ObjectId, label: 'grants', ref: 'Grant'}],
    SSD,
    publish: {type: Boolean, label: 'pubblica sul web', default: true},
    notes: {type: String, label: 'note', widget: 'text'},
    tags: {type:[String], label: 'tags', default: [], enum: ["INdAM Visiting Fellow", "UniPi Visiting Fellow"]},
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Visit = model('Visit', visitSchema)

const Person = require('./Person')

Person.relatedModels.push({
    model: Visit,
    modelName: 'Visit',
    url: 'visit',
    field: 'person',
}, {
    model: Visit,
    modelName: 'Visit',
    url: 'visit',
    field: 'referencePeople',
    multiple: true,
})

const Grant = require('./Grant')

Grant.relatedModels.push({
    model: Visit,
    modelName: 'Visit',
    url: 'visit',
    field: 'grants',
    multiple: true,
})

module.exports = Visit
