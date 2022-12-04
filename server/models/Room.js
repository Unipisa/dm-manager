const {
    Schema, 
    model, 
    ObjectId,
    createdBy, 
    updatedBy, 
    notes
} = require('./Model')

const schema = new Schema({
    number: {type: String, label: 'numero'},
    floor: {type: String, label: 'piano', enum: ["0", "1", "2"]},
    building: {type: String, label: 'edificio', enum: ["A", "B", "Ex-Albergo"]},
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Room = model('Room', schema)

module.exports = Room
