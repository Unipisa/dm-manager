const mongoose = require('mongoose')

const Schema = mongoose.Schema

const visitSchema = new Schema({
    person: { type: Schema.Types.ObjectId, ref: 'Person' },
    startDate: Date,
    endDate: Date,
    affiliation: String,
    roomNumber: String,
    building: String,
    referencePerson: { type: Schema.Types.ObjectId, ref: 'Person' },
    invitedBy: String,
    SSD: String,
    notes: String,
    country: String,
    fundingAgency: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 }, {
     timestamps: true // adds fields: createdAt, updatedAt
 })

 module.exports = mongoose.model('Visit', visitSchema)
