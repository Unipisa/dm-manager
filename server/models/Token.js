const crypto = require('crypto')
const mongoose = require('mongoose-schema-jsonschema')()
const { Schema } = mongoose

const tokenSchema = new Schema({
    name: String,
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
    },
    updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
    },
    token: {
        type: String,
        default: () => crypto.randomBytes(64).toString('hex'),
        required: true,
    },
    roles: {
        type: [String],
        required: true,
    },
 }, {
    timestamps: true // adds fields: createdAt, updatedAt
 })

module.exports = mongoose.model('Token', tokenSchema)
