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

// 
// Seminario
// 

const eventSeminarSchema = new Schema({
    speaker: { type: ObjectId, label: 'Speaker', ref: 'Person', required: true },
    title: { type: String, label: 'Titolo' },
    conferenceRoom: { type: ObjectId, label: 'Stanza', ref: 'ConferenceRoom', required: true },
    startDatetime: { type: Date, label: 'Inizio', widget: 'datetime', default: null },
    duration: { type: Number, label: 'Durata (in minuti)', default: 120 },
    category: {
        type: String,
        label: 'Ciclo di Seminari',
        enum: [
            'algebra-seminar',
            'algebraic-and-arithmetic-geometry-seminar',
            'analysis-seminar',
            'baby-geometri-geometry-and-topology-seminar',
            'dynamical-systems-seminar',
            'geometry-seminar',
            'logic-seminar',
            'probability-stochastic-analysis-and-statistics-seminar',
            'seminar-on-combinatorics-lie-theory-and-topology',
            'seminar-on-numerical-analysis',
            'seminari-map'
        ],
    },
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

// 
// Conferenza
// 

const eventConferenceSchema = new Schema({
    title:  {type: String, label: 'Titolo'},
    startDate,
    endDate,
    SSD,
    url: { type: String, label: 'Sito web' },
    conferenceRoom: { type: ObjectId, label: 'Stanza', ref: 'ConferenceRoom', required: true },
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

// 
// Colloquium
// 

const eventColloquiumSchema = new Schema({
    speaker: { type: ObjectId, label: 'Speaker', ref: 'Person', required: true },
    title:  {type: String, label: 'titolo'},
    conferenceRoom: { type: ObjectId, label: 'Stanza', ref: 'ConferenceRoom', required: true },
    startDatetime: { type: Date, label: 'Inizio', widget: 'datetime', default: null },
    duration: { type: Number, label: 'Durata (in minuti)', default: 120 },
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

// 
// Corso di Dottorato
// 

const lessonSchema = new Schema({
    date: { type: Date, label: 'Data e Orario', required: true },
    duration: { type: Number, label: 'Durata (in minuti)', default: 120, required: true },
    conferenceRoom: { type: ObjectId, label: 'Stanza', ref: 'ConferenceRoom', required: true },
});

const eventPhdCourseSchema = new Schema({
    title:  {type: String, label: 'Titolo'},
    lecturer: { type: ObjectId, label: 'Docente', ref: 'Person', required: true },
    lessons: [lessonSchema],
    
    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventPhdCourse = model('EventPhdCourse', eventPhdCourseSchema)

module.exports = {
    EventSeminar,
    EventConference,
    EventColloquium,
    EventPhdCourse,
}
