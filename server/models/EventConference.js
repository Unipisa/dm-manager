const { 
    model, 
    Schema, 
    ObjectId, 
    startDate, 
    endDate,
    createdBy, 
    updatedBy,
    SSD,
    notes,
} = require('./Model')

const Grant = require('./Grant')

const eventConferenceSchema = new Schema({
    title:  {type: String, label: 'Titolo'},
    startDate,
    endDate,
    SSD,
    url: { type: String, label: 'Sito web' },
    conferenceRoom: { type: ObjectId, label: 'Aula', ref: 'ConferenceRoom', required: true },
    grants: [{type: ObjectId, label: 'grants', ref: 'Grant'}],
    notes,

    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventConference = model('EventConference', eventConferenceSchema)

Grant.relatedModels.push({
    model: EventConference,
    modelName: 'EventConference',
    url: 'event-conference',
    field: 'grants',
    multiple: true,
})

module.exports = EventConference