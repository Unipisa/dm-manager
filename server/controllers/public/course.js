const coursesQuery = require('./courses')

async function courseQuery(req, res) {
    const id = req.params.id
    if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) {
        return res.status(400).send({ error: 'Invalid course ID.' })
    }
    // Use the same public projection as CourseList, selecting only this course.
    const result = await coursesQuery({ query: {} }, { id })
    if (!result.data.length) return res.status(404).send({ error: 'Course not found.' })
    return res.send(result)
}

module.exports = courseQuery
