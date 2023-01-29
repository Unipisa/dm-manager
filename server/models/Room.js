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
    building: {type: String, label: 'edificio', enum: ["A", "B", "X"]},
    nSeats: {type: Number, label: 'numero posti', default: 0},
    notes,
    code: {type: String, label: 'codice', hidden: true},
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
