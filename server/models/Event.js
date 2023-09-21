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

// 
// Seminario
// 

const eventSeminarSchema = new Schema({
    title:  { type: String, label: 'titolo' },
    startDate,
    duration: { type: Number, label: 'durata (in minuti)', default: 120 },
    abstract: { type: String, label: 'abstract' },
    tags: { type: [String], label: 'tags' },
    speaker: { type: ObjectId, label: 'speaker', ref: 'Person', required: true },
    room: { type: ObjectId, label: 'aula', ref: 'Room', required: true },
    
    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventSeminar = model('EventSeminar', eventSeminarSchema)

// 
// Conferenza
// 

const eventConferenceSchema = new Schema({
    title:  {type: String, label: 'titolo'},
    startDate,
    endDate,
    SSD,
    url: { type: String, label: 'sito web' },
    room: { type: ObjectId, label: 'aula', ref: 'Room', required: true },
    notes,

    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventConference = model('EventConference', eventConferenceSchema)

// 
// Colloquium
// 

const eventColloquiumSchema = new Schema({
    title:  {type: String, label: 'titolo'},
    startDate,
    notes,

    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventColloquium = model('EventColloquium', eventColloquiumSchema)

// 
// Corso di Dottorato
// 

const lectureDateSchema = new Schema({
    date: { type: Date, label: 'data e orario', required: true },
    duration: { type: Number, label: 'durata (in minuti)', default: 120, required: true },
    room: { type: ObjectId, label: 'aula', ref: 'Room', required: true },
});

const eventPhdCourseSchema = new Schema({
    title:  {type: String, label: 'titolo'},
    lecturer: { type: ObjectId, label: 'lecturer', ref: 'Person', required: true },
    lectureDates: [lectureDateSchema],
    
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
