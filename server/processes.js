// Custom processes to insert data from end-users. 
const express = require('express')
const router = express.Router()

const addSeminarRouter = require('./controllers/processes/AddSeminar')
router.use('/seminars/add', addSeminarRouter)



module.exports = router