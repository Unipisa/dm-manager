var express = require('express')

const config = require('./config')
const RoomController = require('./controllers/RoomController')
const RoomLabelController = require('./controllers/RoomLabelController')
const RoomAssignmentController = require('./controllers/RoomAssignmentController')
const VisitController = require('./controllers/VisitController')
const GrantController = require('./controllers/GrantController')
const UserController = require('./controllers/UserController')
const TokenController = require('./controllers/TokenController')
const PersonController = require('./controllers/PersonController')

var router = express.Router()

let paths = []
let ModelSchemas = {}

;[
    RoomLabelController, 
    RoomController,
    RoomAssignmentController,
    VisitController, 
    GrantController,
    UserController,
    TokenController,
    PersonController,
].forEach(Controller => {
    const controller = new Controller()
    const schema = controller.getSchema()
    ModelSchemas[schema.modelName] = schema 
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

module.exports = router