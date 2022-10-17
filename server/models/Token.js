const mongoose = require('mongoose')
const crypto = require('crypto')

const Schema = mongoose.Schema

const tokenSchema = new Schema({
    name: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token: {
        type: String,
        default: () => crypto.randomBytes(64).toString('hex')
    },
    roles: [String]
 }, {
    timestamps: true // adds fields: createdAt, updatedAt
 })

module.exports = mongoose.model('Token', tokenSchema)
