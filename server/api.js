
var express = require('express')

const Visit = require('./models/Visit')

var router = express.Router()
   
router.get('/visit/:id', async function(req, res) {
    let visit = await Visit.findById(req.params.id)
    res.send(visit)
})

router.get('/visit', async function (req, res) {
    let visits = await Visit.find()
    res.send({visits})
})

router.put('/visit', async function (req, res) {
    await Visit.create(req.body)
    res.send({})
})

module.exports = router