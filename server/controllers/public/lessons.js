const EventPhdCourse = require('../../models/EventPhdCourse')

async function lessonsQuery(req) {
    const pipeline = [
        {$unwind: '$lessons'},
        {$project: {
            date: '$lessons.date',
            duration: '$lessons.duration',
            lecturers: '$lessons.lecturers',
            conferenceRoom: '$lessons.conferenceRoom',
            course: {
                _id: '$_id',
                title: '$title',
                lecturers: '$lecturers',
            }
        }},
        {$project: {
            _id: 0,
        }},
        {$lookup: {
            from: 'conferencerooms',
            localField: 'conferenceRoom',
            as: 'conferenceRoom',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                }}
            ]
        }},
        {$unwind: {
            path: '$conferenceRoom',
            preserveNullAndEmptyArrays: true
            }
        },
        {$lookup: {
            from: 'people',
            localField: 'course.lecturers',
            as: 'course.lecturers',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    firstName: 1,
                    lastName: 1,
                }}
            ]
        }}
    ];

    const courses = await EventPhdCourse.aggregate(pipeline)

    return courses
}

module.exports = lessonsQuery
