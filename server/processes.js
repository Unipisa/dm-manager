// Custom processes to insert data from end-users. 
const express = require('express')
const router = express.Router()

const { requirePathPermissions } = require('./controllers/middleware')

router.use(requirePathPermissions)

router.use('/seminars', require('./controllers/processes/seminars'))

router.use('/my/visits', require('./controllers/processes/visits'))

router.use('/roomLabels', require('./controllers/processes/roomLabels'))

router.use('/planimetrie', require('./controllers/processes/planimetrie'))

module.exports = router