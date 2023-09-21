const { EventPhdCourse } = require('../models/Event.js')
const Controller = require('./Controller.js')

class EventPhdCourseController extends Controller {
    constructor() {
        super(EventPhdCourse)
        this.path = 'event-phd-course'
        this.managerRoles.push('event-phd-course-manager')
        this.supervisorRoles.push('event-phd-course-manager', 'event-phd-course-supervisor')

        this.searchFields = [
            'title', 'lecturer.firstName', 'lecturer.lastName'
        ]
    }
}

module.exports = EventPhdCourseController
