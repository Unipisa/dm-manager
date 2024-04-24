// Custom processes to insert data from end-users. 
const express = require('express')
const router = express.Router()

const { requirePathPermissions } = require('../middleware')

router.use(requirePathPermissions)

router.use('/seminars', require('./seminars'))

router.use('/my/visits', require('./visitsMy'))

router.use('/visits', require('./visits'))

router.use('/roomLabels', require('./roomLabels'))

router.use('/planimetrie', require('./planimetrie'))

router.use('/sanityCheck', require('./sanityCheck'))

module.exports = router