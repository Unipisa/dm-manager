const { 
    Schema, 
    model, 
    createdBy, 
    updatedBy 
} = require('./Model')

const personSchema = new Schema({
    firstName:  {type: String, label: 'nome'},
    lastName: {type: String, label: 'cognome'},
    affiliation: {type: String, label: 'affiliazione'}, 
    unipiId: {type: String, label: 'matricola unipi'},
    country: {type: String, label: 'nazione'}, 
    email: {type: String, label: 'email'}, 
    phone: {type: String, label: 'telefono'}, 
    notes: {type: String, label: 'note', widget: 'text'},
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

personSchema.index({
    firstName: 'text', 
    lastName: 'text',
    email: 'text',
    affiliation: 'text',
})

const Person = model('Person', personSchema)
Person.relatedModels = []

module.exports = Person
