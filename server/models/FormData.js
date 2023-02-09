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
    form: {type: ObjectId, ref: 'Form', required: true},
    email: {type: String, required: false},
    lastName: {type: String, required: false},
    firstName: {type: String, required: false},
    data: {type: Map, of: String},
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const FormData = model('FormData', schema)
FormData.relatedModels = []

module.exports = FormData
