const {
    Schema, 
    model, 
    createdBy, 
    updatedBy,
} = require('./Model')

const RoomLabel = model('RoomLabel', new Schema({
    names: [String],
    number: { 
        type: String, 
    },
    size: Number, // la dimensione effettiva sara cm: 2^(size/2)
    format: String, // square, rectangle
    state: {
        type: String,
        enum: ['submitted', 'managed'],
        default: 'submitted',
    },
    createdBy,
    updatedBy,
}, {
    timestamps: true
}))

module.exports = RoomLabel
