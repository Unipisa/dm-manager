const ConferenceRoom = require('../models/ConferenceRoom.js')
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
            {   
                $lookup: {
                    from: 'conferencerooms',
                    localField: 'lessons.conferenceRoom',
                    foreignField: '_id',
                    as: 'conferenceRooms',
                    pipeline: [
                        { $project: { name: 1 } },
                    ],
                }
            },
        )
    }

    async aggregatePostProcess(phdCourses) {
        for (const phdCourse of phdCourses) {
            // dictionary of conference rooms by id 
            const conferenceRooms = Object.fromEntries(
                phdCourse.conferenceRooms?.map(c => [c._id, c]) ?? []
            )
            for (const lesson of phdCourse.lessons) {
                lesson.conferenceRoom = conferenceRooms[lesson.conferenceRoom]
            }
            delete phdCourse.conferenceRooms
        }
        return phdCourses
    }
}

module.exports = EventPhdCourseController
