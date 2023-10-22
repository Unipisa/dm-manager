const express = require('express')

const config = require('./config')
const profile = require('./controllers/profile')
const staffQuery = require('./controllers/public/staff')
const visitsQuery = require('./controllers/public/visits')
const seminarsQuery = require('./controllers/public/seminars')

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
    // Event Controllers
    require('./controllers/EventSeminarController'),
    require('./controllers/EventConferenceController'),
    require('./controllers/EventPhdCourseController'),
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

module.exports = router
module.exports.ModelSchemas = ModelSchemas