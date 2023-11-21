// Custom processes to insert data from end-users. 
const express = require('express')
const router = express.Router()

const { requirePathPermissions } = require('./controllers/middleware')

router.use(requirePathPermissions)

const seminarRouter = require('./controllers/processes/seminars')
router.use('/seminars', seminarRouter)

const roomLabelRouter = require('./controllers/processes/roomLabels')
router.use('/roomLabels', roomLabelRouter)

module.exports = router