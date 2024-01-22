const { ObjectId } = require('mongoose').Types

const { escapeRegExp } = require('../Controller')
const Person = require('../../models/Person')
const Institution = require('../../models/Institution')
const PersonController = require('../PersonController')

/**
 * 
 * inject routes for the person select widget
 * 
 * @param {*} router 
 */

module.exports = (router) => {
    router.get('/person', async (req, res) => {        
        const { lastName, firstName, email, affiliation } = req.query
        const $and = []
        let affiliation_id = null
        
        if (affiliation) {
            try {
                affiliation_id = new ObjectId(affiliation)
            } catch(error) {
                return res.status(400).json({ error: `${error}` })
            }
        }

        if (lastName) {
            $and.push({ 
            lastName: { 
                $regex: new RegExp(escapeRegExp(lastName), 'i') 
            }})
        }
        if (firstName) $and.push({
            firstName: {
                $regex: new RegExp(escapeRegExp(firstName), 'i')
            }})
        if (email) $and.push({
            email: {
                $regex: new RegExp(escapeRegExp(email), 'i')
            }}) 
        if (affiliation_id) $and.push({affiliations: affiliation_id}) 

        if ($and.length===0) return res.json({ data: [] })

        const persons = await Person.aggregate([
            {$match: { $and }},
            {$lookup: {
                from: 'institutions',
                localField: 'affiliations',
                foreignField: '_id',
                as: 'affiliations',
                pipeline: [
                    {$project: {
                        _id: 1,
                        name: 1,
                    }}
                ]
            }},
            {$sort: { modifiedAt: -1 }},
            {$limit: 20},
            {$project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                affiliations: 1,
            }},
        ])

        return res.json({ data: persons })
    })

    router.post('/person', async (req, res) => {
        const controller = new PersonController()
        await controller.put(req, res)
    })

    router.patch('/person/:_id', async (req, res) => {
        const id = req.params._id
        const controller = new PersonController()
        await controller.patch(req, res, id, req.body)
    })

    router.get('/institution/search', async (req, res) => {
        const $regex = new RegExp(escapeRegExp(req.query.q), 'i')
        const data = await Institution.aggregate([
            { $match: {$or: [
                {name: { $regex } },
                {alternativeNames: { $regex }},
                {code: { $regex }},
                {city: { $regex }},
                {country: { $regex }},
            ]}},
            { $project: {
                _id: 1,
                name: 1,
            }},
        ])
        res.json({ data })
    })

    router.put('/institution', async (req, res) => {
        let institution
        try {
            institution = new Institution({
                ...req.body,
                createdBy: req.user._id,
                updatedBy: req.user._id,
            })
            await institution.save()
        } catch(error) {
            res.status(400).json({ error: error.message })
        }
        res.json(institution)
    })
}

