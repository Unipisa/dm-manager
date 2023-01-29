const crypto = require('crypto')

const {
    Schema, 
    model, 
    ObjectId,
    createdBy, 
    updatedBy, 
    notes
} = require('./Model')

const tokenSchema = new Schema({
    name: String,
    token: {
        type: String,
        default: () => crypto.randomBytes(16).toString('hex'),
        required: true,
    },
    roles: {
        type: [String],
        required: true,
    },
    createdBy,
    updatedBy,
 }, {
    timestamps: true // adds fields: createdAt, updatedAt
 })

const Token = model('Token', tokenSchema)

module.exports = Token
