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
    gender: {type: String, label: 'genere', 
        enum: ['Uomo', 'Donna', 'Non Specificato'],
        default: 'Non Specificato'},
    country: {type: String, label: 'nazione'}, 
    email: {type: String, label: 'email'}, 
    phone: {type: String, label: 'telefono'}, 
    notes: {type: String, label: 'note', widget: 'text'},
    personalPage: {type: String, label: 'URL pagina personale'},
    orcid: {type: String, label: 'orcid'},
    arxiv_orcid: {type: Boolean, default: false, label: 'arxiv_orcid'},
    google_scholar: {type: String, label: 'google_scholar'},
    mathscinet: {type: String, label: 'mathscinet'},
    cn_ldap: {type: String, label: 'cn_ldap'},
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
