const mongoose = require('mongoose-schema-jsonschema')()
const { Schema } = mongoose

const personSchema = new Schema({
    firstName:  String,
    lastName: String,
    affiliation: String, 
    unipiId: String,
    country: String, 
    email: String, 
    phone: String, 
    notes: String,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 }, {
     timestamps: true // adds fields: createdAt, updatedAt
 })

 personSchema.index({
     firstName: 'text', 
     lastName: 'text',
     email: 'text',
     affiliation: 'text',
    });


 module.exports = mongoose.model('Person', personSchema)
