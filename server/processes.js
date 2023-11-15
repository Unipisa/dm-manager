// Custom processes to insert data from end-users. 
const express = require('express')
const router = express.Router()

const addSeminarRouter = require('./controllers/processes/AddSeminar')
router.use('/seminars/add', addSeminarRouter)

const manageSeminarRouter = require('./controllers/processes/ManageSeminars')
router.use('/seminars', manageSeminarRouter)

module.exports = router