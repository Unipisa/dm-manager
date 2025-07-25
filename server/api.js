const express = require('express')

const config = require('./config')
const profile = require('./controllers/profile')
const conferenceQuery = require('./controllers/public/conference')
const staffQuery = require('./controllers/public/staff')
const visitsQuery = require('./controllers/public/visits')
const seminarsQuery = require('./controllers/public/seminars')
const seminarQuery = require('./controllers/public/seminar')
const coursesQuery = require('./controllers/public/courses')
const lessonsQuery = require('./controllers/public/lessons')
const grantQuery = require('./controllers/public/grant')
const grantsQuery = require('./controllers/public/grants')
const thesesQuery = require('./controllers/public/theses')
const seminarCategoriesQuery = require('./controllers/public/seminar-categories')
const conferencesQuery = require('./controllers/public/conferences')
const processes = require('./controllers/processes/router.js')
const changeRoom = require('./controllers/processes/changeRoom')
const roomsQuery = require('./controllers/public/rooms.js')
const personQuery = require('./controllers/public/person.js')
const unimapQuery = require('./controllers/public/unimap.js')
const urlsQuery = require('./controllers/public/urls.js')

const router = express.Router()

let paths = []
let ModelSchemas = {}

;[
    require('./controllers/SeminarCategoryController'),
    require('./controllers/RoomLabelController'), 
    require('./controllers/RoomController'),
    require('./controllers/ConferenceRoomController'),
    require('./controllers/RoomAssignmentController'),
    require('./controllers/VisitController'),
    require('./controllers/GrantController'),
    require('./controllers/UserController'),
    require('./controllers/TokenController'),
    require('./controllers/GroupController'),
    require('./controllers/PersonController'),
    require('./controllers/InstitutionController'),
    require('./controllers/StaffController'),
    require('./controllers/LogController'),
    require('./controllers/FormController'),
    require('./controllers/ThesisController'),
    require('./controllers/UploadController'),
    require('./controllers/EventSeminarController'),
    require('./controllers/EventConferenceController'),
    require('./controllers/EventPhdCourseController'),
    require('./controllers/UrlController.js'),
].forEach(Controller => {
    const controller = new Controller()
    if (controller.getSchema) {
        const schema = controller.getSchema()
        ModelSchemas[schema.modelName] = schema 
    }
    paths = [...paths, ...controller.register(router)]
})

// Informazioni sugli schemi dei modelli
router.get('/Models', (req, res) => {
    res.send(ModelSchemas)
})

router.get('/', (req, res) => {
    const user = req.user || null
    res.send({
        service: config.SERVER_NAME,
        paths, // documentation
        APP_VERSION: config.VERSION,
        OAUTH2_ENABLED: !!config.OAUTH2_CLIENT_ID,
        user
    })
})

profile(router, "/profile")

router.get('/public/staff', async (req, res) => {
    res.send(await staffQuery(req))
})

router.get('/public/visits', async (req, res) => {
    res.send(await visitsQuery(req))
})

router.get('/public/seminars', async (req, res) => {
    res.send(await seminarsQuery(req))
})

router.get('/public/seminar/:id', async (req, res) => {
    res.send(await seminarQuery(req))
})

router.get('/public/courses', async (req, res) => {
    res.send(await coursesQuery(req))
})

router.get('/public/lessons', async (req, res) => {
    res.send(await lessonsQuery(req))
})

router.get('/public/conference/:id', async (req, res) => {
    res.send(await conferenceQuery(req))
})

router.get('/public/conferences', async (req, res) => {
    res.send(await conferencesQuery(req))
})

router.get('/public/grant/:id', async (req, res) => {
    res.send(await grantQuery(req))
})

router.get('/public/grants', async (req, res) => {
    res.send(await grantsQuery(req))
})

router.get('/public/seminar-categories', async (req, res) => {
    res.send(await seminarCategoriesQuery(req))
})

router.get('/public/rooms', async (req, res) => {
    res.json(await roomsQuery(req))
})

router.get('/public/theses', async (req, res) => {
    res.json(await thesesQuery(req))
})

router.get('/public/person/:id', personQuery)

router.get('/public/unimap/:matricola', unimapQuery)

router.get('/public/urls', async (req, res) => {
    res.json(await urlsQuery(req))
})

// async (req, res) => {
//     res.json(await personQuery(req))
// })


router.use('/process', processes)

router.use('*', async (req, res) => {
    res.status(404).json({error: 'invalid path'})
})

module.exports = router
module.exports.ModelSchemas = ModelSchemas