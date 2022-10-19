var express = require('express')

const RoomLabelController = require('./controllers/RoomLabelController')
const VisitController = require('./controllers/VisitController')
const UserController = require('./controllers/UserController')
const TokenController = require('./controllers/TokenController')

var router = express.Router()

;[
    RoomLabelController, 
    VisitController, 
    UserController,
    TokenController,
].forEach(Controller => {
    const controller = new Controller()
    controller.register(router)
})

module.exports = router