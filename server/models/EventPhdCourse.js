const { 
    model, 
    Schema, 
    ObjectId, 
    createdBy, 
    updatedBy,
} = require('./Model')

const lessonSchema = new Schema({
    date: { type: Date, label: 'Data e Orario', required: true },
    duration: { type: Number, label: 'Durata (in minuti)', default: 60, required: true },
    conferenceRoom: { type: ObjectId, label: 'Aula', ref: 'ConferenceRoom', required: true },
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

module.exports = EventPhdCourse
