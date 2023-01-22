const {
    Schema, 
    model, 
    ObjectId, 
    startDate, 
    endDate, 
    createdBy, 
    updatedBy, 
    multipleSSDs,
    notes
} = require('./Model')

const schema = new Schema({
    name: {type: String, label: 'nome'},
    identifier: {type: String, label: 'identificativo'}, 
    projectType: {type: String, label: 'tipo progetto'},
    funds: {
        type: String,
        label: 'finanziamento',
        enum: ["National", "International"],
        default: "National",
    },
    fundingEntity: {type: String, label: 'ente finanziatore'}, 
    pi: { type: ObjectId, label: 'principal investigator', ref: 'Person' }, 
    localCoordinator: { type: ObjectId, label: 'coordinatore locale', ref: 'Person' }, 
    members: [ { type: ObjectId, label: 'partecipanti', ref: 'Person' } ], 
    startDate, 
    endDate, 
    webSite: {type: String, label: 'URL sito web'}, 
    budgetAmount: {type: String, label: 'budget'}, 
    description: {type: String, label: 'descrizione', widget: 'text'}, 
    // keywords: [{type: String, label: 'parole chiave'}], 
    SSD: multipleSSDs,
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Grant = model('Grant', schema)
Grant.relatedModels = []

const Person = require('./Person')
Person.relatedModels.push({
    model: Grant,
    modelName: 'Grant',
    url: 'grant',
    field: 'pi',
},  {
    model: Grant,
    modelName: 'Grant',
    url: 'grant',
    field: 'localCoordinator',
}, {
    model: Grant,
    modelName: 'Grant',
    url: 'grant',
    field: 'members',
    multiple: true,
})

module.exports = Grant
