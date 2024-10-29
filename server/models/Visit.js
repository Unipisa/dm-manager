const { 
    model, 
    Schema, 
    ObjectId, 
    startDate, 
    endDate,
    SSD, 
    createdBy, 
    updatedBy,
} = require('./Model')

const visitSchema = new Schema({
    person: { type: ObjectId, label: 'visitatore', ref: 'Person' },
    affiliations: [{ type: ObjectId, label: 'affiliazioni al tempo della visita', ref: 'Institution' }],
    startDate,
    endDate,
    collaborationTheme: { type: String, label: 'tema della collaborazione', default: ''},
    requireRoom: { type: Boolean, label: 'richiede stanza', default: false },
    requireSeminar: { type: Boolean, label: 'richiede seminario', default: false },
    requireHotel: { type: String, label: 'albergo', default: ''},
    publish: { type: Boolean, label: 'pubblica', default: true },
    referencePeople: [{ type: ObjectId, label: 'referenti', ref: 'Person' }],
    universityFunded: { type: Boolean, label: 'visita su fondi di Ateneo', default: false},
    grants: [{type: ObjectId, label: 'grants', ref: 'Grant'}],
    SSD,
    notes: {type: String, label: 'note', widget: 'text', default: ""},
    tags: {type:[String], label: 'tags', default: [], enum: ["INdAM Visiting Fellow", "UniPi Visiting Fellow"]},
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Visit = model('Visit', visitSchema)
module.exports = Visit

const Person = require('./Person')
Person.relatedModels.push({
    model: Visit,
    modelName: 'Visit',
    url: 'visit',
    field: 'person',
}, {
    model: Visit,
    modelName: 'Visit',
    url: 'visit',
    field: 'referencePeople',
    multiple: true,
})

const Grant = require('./Grant')
Grant.relatedModels.push({
    model: Visit,
    modelName: 'Visit',
    url: 'visit',
    field: 'grants',
    multiple: true,
})

const Institution = require('./Institution')
Institution.relatedModels.push({
    model: Visit,
    modelName: 'Visit',
    url: 'visit',
    field: 'affiliations',
    multiple: true,
})