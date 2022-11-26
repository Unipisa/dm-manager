var express = require('express')

const config = require('./config')
const RoomLabelController = require('./controllers/RoomLabelController')
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
    VisitController, 
    GrantController,
    UserController,
    TokenController,
    PersonController,
].forEach(Controller => {
    const controller = new Controller()
    paths = [...paths, ...controller.register(router)]
    const Schema = controller.Model.jsonSchema()
    ModelSchemas[Schema.title] = Schema.properties 
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