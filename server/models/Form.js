const {
    Schema, 
    model, 
    ObjectId,
    startDate, 
    endDate,
    createdBy, 
    updatedBy, 
    notes
} = require('./Model')

const schema = new Schema({
    name: {type: String, label: 'nome', required: true, default: ''},
    text: {type: String, label: 'testo', widget:'text', default: ''},
    publish: {type: Boolean, label: 'pubblica', default: false},
    startDate,
    endDate,
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Form = model('Form', schema)
Form.relatedModels = []

module.exports = Form
