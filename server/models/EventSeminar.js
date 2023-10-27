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
    abstract: { type: String, label: 'Abstract (non modificare!)', widget: 'text' },
    oldUrl: { type: String, label: 'URL vecchio', widget: 'url' },
    oldAbstract: { type: String, label: 'Abstract vecchio', widget: 'text' },

    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventSeminar = model('EventSeminar', eventSeminarSchema)
module.exports = EventSeminar

Grant.relatedModels.push({
    model: EventSeminar,
    modelName: 'EventSeminar',
    url: 'event-seminar',
    field: 'grants',
    multiple: true,
})

const Person = require('./Person')
Person.relatedModels.push({
    model: EventSeminar,
    modelName: 'EventSeminar',
    url: 'event-seminar',
    field: 'speaker',
    multiple: false,
})

const ConferenceRoom = require('./ConferenceRoom')
ConferenceRoom.relatedModels.push({
    model: EventSeminar,
    modelName: 'EventSeminar',
    url: 'event-seminar',
    field: 'conferenceRoom',
})
