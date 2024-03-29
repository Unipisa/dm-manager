const {
    Schema, 
    model, 
    ObjectId,
    createdBy, 
    updatedBy
} = require('./Model')

const schema = new Schema({
    name: { type: String, label: 'Nome', required: true, default: 'Aula ???' },
    room: { type: ObjectId, label: 'Stanza', ref: 'Room' },
    names: { type: [String], label: 'Nomi alternativi' },
    createdBy,
    updatedBy,
})

const ConferenceRoom = model('ConferenceRoom', schema)
ConferenceRoom.relatedModels = []

/**
 * Questa è giusto una collezione intermedia che include alcune delle stanze
 * presenti in dipartimento.
 */
module.exports = ConferenceRoom
