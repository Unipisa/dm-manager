const EventPhdCourse = require('../../models/EventPhdCourse')

async function coursesQuery(req) {
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

    if (from !== undefined) {
        match["endDate"] = { "$gte": from }
    }
    if (to !== undefined) {
        match["startDate"] = { "$lte": to }
    }

    const pipeline = [
        { $match: match },
        { $lookup: {
            from: 'people',
            localField: 'lecturers',
            foreignField: '_id',
            as: 'lecturers',
        }},
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true
        }},
        { $project: {
            _id: 1,
            startDate: 1,
            endDate: 1,
            title: 1,
            description: 1,
            lecturers: {
                _id: 1,
                firstName: 1,
                lastName: 1   
            }
        }}
    ];

    const courses = await EventPhdCourse.aggregate(pipeline);

    return {
        data: courses
    };
}

module.exports = coursesQuery;