const EventPhdCourse = require('../../models/EventPhdCourse')

const maxDate = new Date(8640000000000000);

async function lessonsQuery(req) {
    // TODO: Forse serve usare $add ~> <https://www.mongodb.com/docs/manual/reference/operator/aggregation/add>
    const from = req.query.from ? new Date(req.query.from) : new Date()
    const to = req.query.to ? new Date(req.query.to) : maxDate

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
                description: '$description',
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
