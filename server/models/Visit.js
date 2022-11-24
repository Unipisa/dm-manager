const mongoose = require('mongoose-schema-jsonschema')()

const SSD = require('./SSD')
const { Schema } = mongoose

const visitSchema = new Schema({
    person: { type: Schema.Types.ObjectId, ref: 'Person' },
    affiliation: String,
    country: String,
    startDate: Date,
    endDate: Date,
    roomNumber: String,
    building: String,
    referencePeople: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
    fundingAgency: String,
    SSD,
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
 }, {
     timestamps: true // adds fields: createdAt, updatedAt
 })

 module.exports = mongoose.model('Visit', visitSchema)
