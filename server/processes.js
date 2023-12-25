// Custom processes to insert data from end-users. 
const express = require('express')
const router = express.Router()

const { requirePathPermissions } = require('./controllers/middleware')

router.use(requirePathPermissions)

const seminarRouter = require('./controllers/processes/seminars')
router.use('/seminars', seminarRouter)

const visitRouter = require('./controllers/processes/visits')
router.use('/visits', visitRouter)

const roomLabelRouter = require('./controllers/processes/roomLabels')
router.use('/roomLabels', roomLabelRouter)

const planimetrieRouter = require('./controllers/processes/planimetrie')
router.use('/planimetrie', planimetrieRouter)

module.exports = router