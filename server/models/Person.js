const { 
    Schema, 
    model, 
    createdBy, 
    updatedBy, 
    ObjectId
} = require('./Model')

const personSchema = new Schema({
    firstName:  {type: String, label: 'nome'},
    lastName: {type: String, label: 'cognome'},
    affiliations: [{ type: ObjectId, label: 'affiliazioni correnti', ref: 'Institution' }],
    gender: {type: String, label: 'genere', 
        enum: ['Uomo', 'Donna', 'Non Specificato'],
        default: 'Non Specificato', 
        can_edit_in_profile: true,
    },
    email: {type: String, label: 'email'}, 
    phone: {type: String, label: 'telefono', can_edit_in_profile: true}, 
    notes: {type: String, label: 'note', widget: 'text'},
    personalPage: {type: String, label: 'URL pagina personale', widget: 'url', can_edit_in_profile: true},
    orcid: {type: String, label: 'orcid', can_edit_in_profile: true},
    arxiv_orcid: {type: Boolean, default: false, label: 'arxiv_orcid', can_edit_in_profile: true},
    google_scholar: {type: String, label: 'google_scholar', can_edit_in_profile: true},
    mathscinet: {type: String, label: 'mathscinet', can_edit_in_profile: true},
    photoUrl: {type: String, label: 'foto', widget: 'image', can_edit_in_profile: true},
    genealogyId: {type: String, label: 'math genealogy id', can_edit_in_profile: true},
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

const Institution = require('./Institution')
Institution.relatedModels.push({
    model: Person,
    modelName: 'Person',
    url: 'person',
    field: 'affiliations',
    multiple: true,
})