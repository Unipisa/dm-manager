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
    roomNumber: {type: String, label: 'piano, numero stanza'},
    building: {type: String, label: 'edificio'},
    referencePeople: [{ type: ObjectId, label: 'referenti', ref: 'Person' }],
    fundingAgency: {type: String, label: 'ente finanziatore'},
    SSD,
    publish: {type: Boolean, label: 'pubblica sul web', default: true},
    notes: {type: String, label: 'note', widget: 'text'},
    createdBy,
    updatedBy,
 }, {
     timestamps: true // adds fields: createdAt, updatedAt
 })

 module.exports = model('Visit', visitSchema)
