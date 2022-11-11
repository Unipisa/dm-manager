const mongoose = require('mongoose')

const Schema = mongoose.Schema

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

 module.exports = mongoose.model('Person', personSchema)
