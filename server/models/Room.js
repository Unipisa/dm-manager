const {
    Schema, 
    model, 
    ObjectId,
    createdBy, 
    updatedBy, 
    notes
} = require('./Model')

const schema = new Schema({
    number: {type: String, label: 'numero', default:'', required: true},
    floor: {type: String, label: 'piano', enum: ["0", "1", "2"], default:'0', required: true},
    building: {type: String, label: 'edificio', enum: ["A", "B", "X"], default:'A', required: true},
    nSeats: {type: Number, label: 'numero posti', default: 0, required: true},
    description: { type: String, label: 'descrizione', help: 'Attenzione: il campo descrizione è quello che appare online sulla mappa del Dipartimento', default: '' },
    notes,
    code: {type: String, label: 'codice', hidden: true},
    polygon: {type: String, label: "Map coordinates"},
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

schema.pre('save', function(next) {
    this.code = `${this.building}${this.floor}:${this.number}`
    next()
})

const Room = model('Room', schema)
module.exports = Room

Room.relatedModels = []
