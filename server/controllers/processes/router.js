// Custom processes to insert data from end-users. 
const express = require('express')
const router = express.Router()

const { requirePathPermissions } = require('../middleware')

router.use(requirePathPermissions)

router.use('/seminars', require('./seminars'))

router.use('/conferences', require('./conferences'))

router.use('/my/visits', require('./visitsMy'))

router.use('/visits', require('./visits'))

router.use('/visitsList', require('./visitsList'))

router.use('/roomAssignmentsList', require('./roomAssignmentsList'))

router.use('/roomLabels', require('./roomLabels'))

router.use('/planimetrie', require('./planimetrie'))

router.use('/sanityCheck', require('./sanityCheck'))

router.use('/my/urls', require('./urls'))

router.use('/mrbsRoomsBookings', require('./mrbsRoomsBookings'))

module.exports = router