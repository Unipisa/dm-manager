// Custom processes to insert data from end-users. 
const express = require('express')
const router = express.Router()

const seminarRouter = require('./controllers/processes/seminars')
router.use('/seminars', seminarRouter)

module.exports = router