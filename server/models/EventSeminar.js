const { 
    model, 
    Schema, 
    ObjectId, 
    createdBy, 
    updatedBy,
} = require('./Model')

const Grant = require('./Grant')

const eventSeminarSchema = new Schema({
    speaker: { type: ObjectId, label: 'Speaker', ref: 'Person', required: true },
    title: { type: String, label: 'Titolo' },
    conferenceRoom: { type: ObjectId, label: 'Aula', ref: 'ConferenceRoom', required: true },
    startDatetime: { type: Date, label: 'Inizio', widget: 'datetime', default: null },
    duration: { type: Number, label: 'Durata (in minuti)', default: 60 },
    category: { type: ObjectId, label: 'Ciclo di Seminari', ref: 'SeminarCategory', required: true },
    grants: [{type: ObjectId, label: 'grants', ref: 'Grant'}],
    abstract: { type: String, label: 'Abstract', widget: 'text' },
    
    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventSeminar = model('EventSeminar', eventSeminarSchema)

Grant.relatedModels.push({
    model: EventSeminar,
    modelName: 'EventSeminar',
    url: 'event-seminar',
    field: 'grants',
    multiple: true,
})

module.exports = EventSeminar
