const EventPhdCourse = require('../models/EventPhdCourse.js')
const Controller = require('./Controller.js')

class EventPhdCourseController extends Controller {
    constructor() {
        super(EventPhdCourse)
        this.path = 'event-phd-course'
        this.managerRoles.push('event-phd-course-manager')
        this.supervisorRoles.push('event-phd-course-manager', 'event-phd-course-supervisor')

        this.searchFields = [
            'title',
            'description',
        ]

        this.queryPipeline.push(
            { $unwind: '$lessons' },
            {
                $lookup: {
                    from: 'conferencerooms',
                    localField: 'lessons.conferenceRoom',
                    foreignField: '_id',
                    as: 'lessons.conferenceRoom',
                    pipeline: [
                        { $project: { name: 1 } },
                    ],
                }
            },
            {
                $unwind: {
                    path: '$lessons.conferenceRoom',
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $group: {
                    _id: '$_id',
                    title: { $first: '$title' },
                    description: { $first: '$description' },
                    startDate: { $first: '$startDate' },
                    endDate: { $first: '$endDate' },
                    lessons: { $push: "$lessons" },
                    lecturers: { $first: '$lecturers' },
                    createdBy: { $first: '$createdBy' },
                    updatedBy: { $first: '$updatedBy' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                }
            },
        )
    }
}

module.exports = EventPhdCourseController
