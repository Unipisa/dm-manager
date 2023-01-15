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
    person: { type: ObjectId, label: 'persona', ref: 'Person', required: true },
    room: { type: ObjectId, label: 'stanza', ref: 'Room', required: true },
    startDate,
    endDate,
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const RoomAssignment = model('RoomAssignment', schema)

module.exports = RoomAssignment

const Person = require('./Person')

Person.relatedModels.push({
    model: RoomAssignment,
    modelName: 'RoomAssignment',
    url: 'roomAssignment',
    field: 'person',
})

const Room = require('./Room')

Room.relatedModels.push({
    model: RoomAssignment,
    modelName: 'RoomAssignment',
    url: 'roomAssignment',
    field: 'room',
})
