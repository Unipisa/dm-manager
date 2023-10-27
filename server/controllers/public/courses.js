const EventPhdCourse = require('../../models/EventPhdCourse')

async function coursesQuery(req) {
    const pipeline = [
        { $project: {
            _id: 1,
            speaker: 1,
            lecturer: 1,
            title: 1,
            lessons: 1,
        }},
    ]

    // console.log(JSON.stringify({pipeline}))

    const courses = await EventPhdCourse.aggregate(pipeline)

    return courses
}

module.exports = coursesQuery
