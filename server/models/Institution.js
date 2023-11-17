const {
    Schema, 
    model, 
    ObjectId,
    createdBy, 
    updatedBy, 
    notes
} = require('./Model')

const schema = new Schema({
    name: {type: String, label: 'nome', default:'', required: true},
    country: {type: String, label: 'paese', default: ''},
    city: {type: String, label: 'città', default: ''},
    code: {type: String, label: 'codice', default: ''},
    alternativeNames: {type: [String], label:'alternative names', widget: 'list'},
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Institution = model('Institution', schema)
module.exports = Institution

Institution.relatedModels = []


