const EventPhdCourse = require('../../models/EventPhdCourse')

async function lessonsQuery(req) {
    var from = undefined;
    switch (req.query.from) {
        case 'now':
            from = new Date()
            break;
        case undefined:
            from = undefined
            break;
        default:
            from = new Date(req.query.from)
    }

    var to = undefined;
    switch (req.query.to) {
        case 'now':
            to = new Date()
            break;
        case undefined:
            to = undefined
            break;
        default:
            to = new Date(req.query.to)
    }

    var match = {}

    if (from !== undefined || to !== undefined) {
        let dateCondition = {}
        if (from !== undefined) {
            dateCondition.$gte = from
        }
        if (to !== undefined) {
            dateCondition.$lte = to
        }
        match["lessons"] = { $elemMatch: { date: dateCondition } }
    }

    if (req.query.phd) {
        match["phd"] = req.query.phd
    }

    const pipeline = [
        {$match: match},
        {$unwind: '$lessons'},
        ...(from !== undefined || to !== undefined ? [{
            $match: {
                ...(from !== undefined && { "lessons.date": { $gte: from } }),
                ...(to !== undefined && { "lessons.date": { $lte: to } })
            }
        }] : []),
        {$project: {
            date: '$lessons.date',
            duration: '$lessons.duration',
            lecturers: '$lessons.lecturers',
            conferenceRoom: '$lessons.conferenceRoom',
            course: {
                _id: '$_id',
                title: '$title',
                description: '$description',
                phd: '$phd',
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

    return {
        data: courses
    }
}

module.exports = lessonsQuery
