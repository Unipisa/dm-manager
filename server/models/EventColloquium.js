const { 
    model, 
    Schema, 
    ObjectId, 
    createdBy, 
    updatedBy,
    notes,
} = require('./Model')

const Grant = require('./Grant')

const eventColloquiumSchema = new Schema({
    speaker: { type: ObjectId, label: 'Speaker', ref: 'Person', required: true },
    title:  {type: String, label: 'titolo'},
    conferenceRoom: { type: ObjectId, label: 'Aula', ref: 'ConferenceRoom', required: true },
    startDatetime: { type: Date, label: 'Inizio', widget: 'datetime', default: null },
    duration: { type: Number, label: 'Durata (in minuti)', default: 60 },
    grants: [{type: ObjectId, label: 'grants', ref: 'Grant'}],
    notes,

    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventColloquium = model('EventColloquium', eventColloquiumSchema)

Grant.relatedModels.push({
    model: EventColloquium,
    modelName: 'EventColloquium',
    url: 'event-colloquium',
    field: 'grants',
    multiple: true,
})

module.exports = EventColloquium