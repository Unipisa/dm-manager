const {
    Schema, 
    model, 
    ObjectId,
    startDate,
    endDate,
    createdBy, 
    updatedBy, 
    notes
} = require('./Model')

const schema = new Schema({
    person: { type: ObjectId, label: 'persona', ref: 'Person' },
    room: { type: ObjectId, label: 'stanza', ref: 'Room' },
    startDate,
    endDate,
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const RoomAssignement = model('RoomAssignement', schema)

module.exports = RoomAssignement
