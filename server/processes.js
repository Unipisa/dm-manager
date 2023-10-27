// Custom processes to insert data from end-users. 
const express = require('express')

const router = express.Router()

router.get('/', function (req, res) {
    res.send('ok')
})

module.exports = router