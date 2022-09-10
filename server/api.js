
var express = require('express')

const Visit = require('./models/Visit')

 
var router = express.Router()
   
router.put('/visit', function (req, res, next) {
    console.log(`req.body: ${req.body}`)
    Visit.create(req.body)
    res.send({})
})

module.exports = router