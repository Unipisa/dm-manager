const express = require('express')
const Person = require('../../models/Person')
const router = express.Router()

const EventSeminar = require('../../models/EventSeminar')

router.get('/searchPerson', async (req, res) => {
    const lastName = req.query.lastName

    if (lastName) {
        const people = await Person.aggregate([
            { $match: { lastName: {$regex: lastName, $options: 'i'} } },
            { $lookup: {
                from: 'institutions',
                localField: 'affiliations',
                foreignField: '_id',
                as: 'affiliations'
            }}
        ])
        res.json(JSON.stringify(people))
    }
    else {
        res.json(JSON.stringify([]))
    }

})

router.put('/save', async (req, res) => {
    const seminar = EventSeminar(req.body)
    console.log(seminar)
    try {
        await seminar.save()
        res.send({ result: "OK" })
    }
    catch (error) {
        res.status(400).send({ error: error.message })
    }
})

module.exports = router