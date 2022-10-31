const mongoose = require('mongoose')

const Schema = mongoose.Schema

const visitSchema = new Schema({
    person: { type: Schema.Types.ObjectId, ref: 'Person' },
    startDate: Date,
    endDate: Date,
    firstName: String,
    lastName: String,
    affiliation: String,
    email: String,
    roomNumber: String,
    building: String,
    invitedBy: String,
    SSD: String,
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
 }, {
     timestamps: true // adds fields: createdAt, updatedAt
 })

 module.exports = mongoose.model('Visit', visitSchema)
