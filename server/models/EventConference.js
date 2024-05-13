const { 
    model, 
    Schema, 
    ObjectId, 
    startDate, 
    endDate,
    createdBy, 
    updatedBy,
    multipleSSDs,
    notes,
} = require('./Model')

const eventConferenceSchema = new Schema({
    title:  {type: String, label: 'Titolo'},
    startDate,
    endDate,
    SSD: multipleSSDs,
    url: { type: String, label: 'Sito web', widget: 'url' },
    conferenceRoom: { type: ObjectId, label: 'Aula', ref: 'ConferenceRoom', required: false },
    institution: { type: ObjectId, label: 'Istituzione (solo se diversa da unipi)', ref: 'Institution' },
    isOutreach: { type: Boolean, label: 'Terza missione', widget: 'checkbox' },
    grants: [{type: ObjectId, label: 'grants', ref: 'Grant'}],
    description: { type: String, label: 'Descrizione', widget: 'text'},
    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventConference = model('EventConference', eventConferenceSchema)
module.exports = EventConference

const Grant = require('./Grant')
Grant.relatedModels.push({
    model: EventConference,
    modelName: 'EventConference',
    url: 'event-conference',
    field: 'grants',
    multiple: true,
})

const ConferenceRoom = require('./ConferenceRoom')
ConferenceRoom.relatedModels.push({
    model: EventConference,
    modelName: 'EventConference',
    url: 'event-conference',
    field: 'conferenceRoom',
})
