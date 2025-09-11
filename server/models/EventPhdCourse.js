const { 
    model, 
    Schema, 
    ObjectId, 
    createdBy, 
    updatedBy,
    startDate,
    endDate,
} = require('./Model')

const lessonSchema = new Schema({
    date: { type: Date, label: 'Data e Orario', required: true },
    duration: { type: Number, label: 'Durata (in minuti)', default: 60, required: true },
    conferenceRoom: { type: ObjectId, label: 'Aula', ref: 'ConferenceRoom', required: true },
    mrbsBookingID: { type: Number, label: 'ID Prenotazione Rooms' },
});

const eventPhdCourseSchema = new Schema({
    title: { type: String, label: 'Titolo'},
    coordinators: [{type: ObjectId, label: 'Referenti', ref: 'Person'}],
    description: { type: String, label: 'Descrizione', widget: 'text', default: '' },
    phd: {
        type: String,
        label: 'Dottorato in',
        enum: ["Matematica", "HPSC"],
        default: "Matematica",
    },
    courseType: {
        type: String,
        label: 'Tipo',
        enum: [null, "Foundational", "Methodological", "Thematic"],
        default: null
    },
    startDate,
    endDate,
    lecturers: [{ type: ObjectId, label: 'Docente/i', ref: 'Person', default: [], required: true }],
    lessons: [lessonSchema],
    
    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const EventPhdCourse = model('EventPhdCourse', eventPhdCourseSchema)

module.exports = EventPhdCourse
