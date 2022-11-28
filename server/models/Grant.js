const mongoose = require('mongoose-schema-jsonschema')()

const SSD = require('./SSD')

const { Schema } = mongoose

const schema = new Schema({
    name: String,
    identifier: String, 
    projectType: String, 
    funds: {
        type: String,
        enum: ["National", "International"],
        default: "National",
    },
    fundingEntity: String, 
    pi: { type: Schema.Types.ObjectId, ref: 'Person' }, 
    localCoordinator: { type: Schema.Types.ObjectId, ref: 'Person' }, 
    members: [ { type: Schema.Types.ObjectId, ref: 'Person' } ], 
    startDate: Date, 
    endDate: Date, 
    webSite: String, 
    budgetAmount: String, 
    description: String, 
    keywords: [String], 
    SSD,
    notes: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 }, {
     timestamps: true // adds fields: createdAt, updatedAt
 })

 module.exports = mongoose.model('Grant', schema)
