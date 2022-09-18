
var express = require('express')

const Visit = require('./models/Visit')

var router = express.Router()
   
router.get('/visit/:id', async function(req, res) {
    try {
        let visit = await Visit.findById(req.params.id)
        res.send(visit)
    } catch(err) {
        console.error(err)
        res.status(404)
    }
})

router.patch('/visit/:id', async (req, res) => {
    const payload = req.body
    try {
        console.log(`payload: ${JSON.stringify(payload)}`)
        const visit = await Visit.findByIdAndUpdate(req.params.id, payload)
        res.send(visit)
    } catch(err) {
        console.error(err)
        res.status(400).send({error: err.message})
    }
})

router.get('/visit', async (req, res) => {
    let visits = await Visit.find()
    res.send({visits})
})

router.put('/visit', async (req, res) => {
    try {
        await Visit.create(req.body)
        res.send({})
    } catch(err) {
        console.error(err)
        res.status(400).send({ error: err.message })
    }
})


module.exports = router