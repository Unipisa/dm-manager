const mongoose = require('mongoose')
const Schema = mongoose.Schema

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
    pi: String, 
    localCoordinator: String, 
    members: [ String ], 
    startDate: Date, 
    endDate: Date, 
    webSite: String, 
    budgetAmount: String, 
    description: String, 
    keywords: [String], 
    ssd: String,
    notes: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 }, {
     timestamps: true // adds fields: createdAt, updatedAt
 })

 module.exports = mongoose.model('Grant', schema)
