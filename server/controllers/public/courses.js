const { duration } = require('moment');
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

    const lookupPipeline = (from, localField, foreignField, as, additionalPipeline = []) => ({
        $lookup: {
            from,
            localField,
            foreignField,
            as,
            pipeline: additionalPipeline
        }
    });

    const projectFields = (fields) => ({ $project: fields });
    
    const pipeline = [
        { $match: match },
        lookupPipeline('people', 'lecturers', '_id', 'lecturers', [
            lookupPipeline('institutions', 'affiliations', '_id', 'affiliations'),
            projectFields({
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                affiliations: {_id: 1, name: 1}
            })
        ]),
        { $unwind: { path: '$lessons', preserveNullAndEmptyArrays: true } },
        lookupPipeline('conferencerooms', 'lessons.conferenceRoom', '_id', 'conferenceRoom', [
            projectFields({ name: 1, room: 1 })
        ]),
        { $unwind: { path: '$conferenceRoom', preserveNullAndEmptyArrays: true } },
        { $group: {
            _id: '$_id',
            startDate: { $first: '$startDate' },
            endDate: { $first: '$endDate' },
            title: { $first: '$title' },
            description: { $first: '$description' },
            lecturers: { $first: '$lecturers' },
            lessons: { $push: {
                _id: '$lessons._id',
                date: '$lessons.date',
                duration: '$lessons.duration',
                conferenceRoom: '$conferenceRoom.name',
                conferenceRoomID: '$conferenceRoom.room'
            }}
        }},
        { $project: {
            _id: 1,
            startDate: 1,
            endDate: 1,
            title: 1,
            description: 1,
            lecturers: 1,
            lessons: 1
        }}
    ];
    
    const courses = await EventPhdCourse.aggregate(pipeline);

    return {
        data: courses
    };
}

module.exports = coursesQuery;