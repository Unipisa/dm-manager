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
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Institution = model('Institution', schema)
module.exports = Institution

Institution.relatedModels = []


