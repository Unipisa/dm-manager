
var express = require('express')

const Visit = require('./models/Visit')

 
var router = express.Router()
   
router.get('/visit', async function (req, res) {
    let visits = await Visit.find()
    res.send({visits})
})

router.put('/visit', async function (req, res) {
    console.log(`req.body: ${req.body}`)
    await Visit.create(req.body)
    res.send({})
})

module.exports = router