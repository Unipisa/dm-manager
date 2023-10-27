const EventPhdCourse = require('../../models/EventPhdCourse')

async function coursesQuery(req) {
    const pipeline = [
        {$unwind: '$lessons'},
        {$lookup: {
            from: 'conferencerooms',
            localField: 'lessons.conferenceRoom',
            as: 'lessons.conferenceRoom',
            foreignField: '_id'
        }},
        { $project: {
            _id: 1,
            speaker: 1,
            lecturer: 1,
            title: 1,
            lessons: {
                date: 1,
                duration: 1,
                conferenceRoom: {
                    name: 1
                }
            }
        }}
    ];

    const courses = await EventPhdCourse.aggregate(pipeline)

    return courses
}

module.exports = coursesQuery
