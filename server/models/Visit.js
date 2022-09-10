const mongoose = require('mongoose')

const Schema = mongoose.Schema

const visitSchema = new Schema({
    startDate: Date,
    endDate: Date,
    firstName: String,
    lastName: String,
    email: String,
    roomNumber: String,
    building: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 }, {
     timestamps: true // adds fields: createdAt, updatedAt
 })

 module.exports = mongoose.model('Visit', visitSchema)
