const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

module.exports = mongoose.model('RoomLabel', new Schema({
    names: [String],
    number: String,
    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
}, {
    timestamps: true
}))
