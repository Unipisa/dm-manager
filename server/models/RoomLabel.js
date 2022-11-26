const mongoose = require('mongoose-schema-jsonschema')()
const { Schema } = mongoose

const ObjectId = Schema.Types.ObjectId

module.exports = mongoose.model('RoomLabel', new Schema({
    names: [String],
    number: String,
    size: Number, // la dimensione effettiva sara cm: 2^(size/2)
    state: {
        type: String,
        enum: ['submitted', 'managed'],
        default: 'submitted',
    },
    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
}, {
    timestamps: true
}))
