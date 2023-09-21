var express = require('express')

const config = require('./config')
const profile = require('./controllers/profile')

var router = express.Router()

let paths = []
let ModelSchemas = {}

;[
    require('./controllers/RoomLabelController'), 
    require('./controllers/RoomController'),
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
    require('./controllers/EventColloquiumController'),
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

module.exports = router
module.exports.ModelSchemas = ModelSchemas