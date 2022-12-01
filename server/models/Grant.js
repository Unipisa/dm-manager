const {
    Schema, 
    model, 
    ObjectId, 
    startDate, 
    endDate, 
    createdBy, 
    updatedBy, 
    SSD, 
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
    keywords: [{type: String, label: 'parole chiave'}], 
    SSD,
    notes,
    createdBy,
    updatedBy,
 }, {
     timestamps: true // adds fields: createdAt, updatedAt
 })

 module.exports = model('Grant', schema)
