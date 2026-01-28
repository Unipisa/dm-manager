const {
    Schema,
    model,
    ObjectId,
    notes,
    groupCodes,
    createdBy,
    updatedBy,
} = require('./Model')

const documentSchema = new Schema({
    name: { type: String, label: 'nome', required: true },
    description: { type: String, label: 'descrizione', widget: 'text', default: '' },
    date: { type: Date, label: 'data', default: Date.now },
    access_codes: {
        type: [String], 
        label: 'codici accesso',
        help: 'Controlla chi può accedere al documento: "pubblico" = tutti, "utente-con-credenziali-manage" = utenti loggati, codici gruppo specifici = solo membri di quei gruppi. Per selezionare più di un gruppo premere Ctrl', 
        enum: [
            'pubblico',
            'utente-con-credenziali-manage',
            ...groupCodes 
        ],
        default: ['pubblico'],
        can_filter: true
    },
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
