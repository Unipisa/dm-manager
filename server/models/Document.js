const {
    Schema,
    model,
    ObjectId,
    notes,
    createdBy,
    updatedBy,
} = require('./Model')

const documentSchema = new Schema({
    name: { type: String, label: 'nome', required: true },
    description: { type: String, label: 'descrizione', widget: 'text', default: '' },
    date: { type: Date, label: 'data', default: Date.now },
    group_codes: {type: [String], label: 'codici gruppi', help: 'I membri dei gruppi con questi codici hanno accesso al documento', default: [] },
    owners: [{ type: ObjectId, ref: 'Person', label: 'proprietari', default: [] }],
    attachments: [{ type: ObjectId, ref: 'Upload', label: 'allegati', widget: 'multiple-attachment'}],
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true,
})

const Document = model('Document', documentSchema)
Document.relatedModels = []

module.exports = Document
