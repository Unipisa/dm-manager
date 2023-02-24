const {
    Schema, 
    model, 
    ObjectId,
    startDate, 
    endDate,
    createdBy, 
    updatedBy, 
    notes
} = require('./Model')

const schema = new Schema({
    name: {type: String, label: 'nome', required: true, default: ''},
    text: {type: String, label: 'testo', widget:'text', default: ''},
    publish: {type: Boolean, label: 'pubblica', default: false, 
        help: '*** non ancora implementato *** se attivato il form viene elencato. Altrimenti il form è accessibile solamente tramite link diretto.'},
    startDate: {...startDate, help: '*** non ancora implementato *** il form è compilabile solamente a partire da questa data'},
    endDate: {...endDate, help: '*** non ancora implementato *** il form non è più compilabile a partire da questa data'},
    requireUser: {type: Boolean, label: 'richiede utente', default: true, help: '*** non ancora implementato *** se attivato il form può essere compilato solo da utenti registrati'},    
    restrictedGroup: {type: ObjectId, ref: 'Group', label: 'gruppo ristretto', default: [], help: '*** non ancora implementato *** se attivato il form può essere compilato solo da utenti appartenenti a un gruppo'},
    canChangeAnswers: {type: Boolean, label: 'modifica risposte', default: false, help: '*** non ancora implementato *** se attivato gli utenti possono modificare le risposte'},
    notifyUsers: [{type: ObjectId, ref: 'User', label: 'notifica utenti', help: '*** non ancora implementato *** se attivato gli utenti selezionati ricevono una notifica quando il form viene compilato'}],
    editors: [{type: ObjectId, ref: 'User', label: 'amministratori', help: '*** non ancora implementato *** gli utenti selezionati possono modificare il form'}],
    supervisors: [{type: ObjectId, ref: 'User', label: 'supervisori', help: '*** non ancora implementato *** gli utenti selezionati possono vedere i dati compilati'}],
    notes,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Form = model('Form', schema)
Form.relatedModels = []

module.exports = Form
