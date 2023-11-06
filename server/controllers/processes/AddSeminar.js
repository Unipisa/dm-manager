const express = require('express')
const Person = require('../../models/Person')
const router = express.Router()

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

module.exports = router