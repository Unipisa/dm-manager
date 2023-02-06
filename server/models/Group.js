const { faSearch } = require('@fortawesome/free-solid-svg-icons')
const {
    Schema, 
    model, 
    ObjectId,
    startDate, 
    endDate,
    createdBy, 
    updatedBy, 
    notes,
} = require('./Model')

const schema = new Schema({
    name: {type: String, label: 'nome', required: true},
    startDate,
    endDate,
    members: [{ type: ObjectId, label: 'membri', ref: 'Person', default: [], required: true }],
    notes,
    chair: { type: ObjectId, label: 'chair', ref: 'Person', help: "Presidente / direttore / coordinatore / ecc. (opzionale)"}, 
    chair_title: { type: String, label: 'titolo del chair', help: 'Nome della carica "chair": (es. "presidente", "direttore")' },
    vice: { type: ObjectId, label: 'vice', ref: 'Person', help: "Vice (opzionale)"}, 
    vice_title: { type: String, label: 'titolo del vice', help: 'Nome della carica "vice": (es. "vicepresidente", "vicedirettore")' },
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Group = model('Group', schema)
Group.relatedModels = []

module.exports = Group

const Person = require('./Person')

Person.relatedModels.push({
    model: Group,
    modelName: 'Group',
    url: 'group',
    field: 'members',
})

