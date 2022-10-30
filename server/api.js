var express = require('express')

const config = require('./config')
const RoomLabelController = require('./controllers/RoomLabelController')
const VisitController = require('./controllers/VisitController')
const UserController = require('./controllers/UserController')
const TokenController = require('./controllers/TokenController')
const PersonController = require('./controllers/PersonController')

var router = express.Router()

let paths = []

;[
    RoomLabelController, 
    VisitController, 
    UserController,
    TokenController,
    PersonController,
].forEach(Controller => {
    const controller = new Controller()
    paths = [...paths, ...controller.register(router)]
})

router.get('/', (req, res) => {
    const user = req.user || null
    res.send({
        service: 'dm-manager',
        paths, // documentation
        APP_VERSION: config.VERSION,
        OAUTH2_ENABLED: !!config.OAUTH2_CLIENT_ID,
        user
    })
})

module.exports = router