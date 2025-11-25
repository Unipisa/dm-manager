const {
    Schema,
    model,
    ObjectId,
    notes,
    createdBy,
    updatedBy,
} = require('./Model')

const documentSchema = new Schema({
    name: { type: String, label: 'titolo', required: true },
    description: { type: String, label: 'descrizione', widget: 'text', default: '' },
    date: { type: Date, label: 'data', default: Date.now },
    group_codes: {type: [String], label: 'codici gruppi', help: 'I membri dei gruppi con questi codici hanno accesso al documento', default: [] },
    owners: [{ type: ObjectId, ref: 'Person', label: 'proprietari', default: [] }],
    attachment: {type: String, label: 'allegato', widget: 'private-attachment', can_edit_in_profile: true},    
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true,
})

const Document = model('Document', documentSchema)
Document.relatedModels = []

module.exports = Document
