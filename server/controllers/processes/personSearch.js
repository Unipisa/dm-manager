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
    router.get('/person/search', async (req, res) => {
        const $regex = new RegExp(escapeRegExp(req.query.q), 'i')
        const data = await Person.aggregate([
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
            {$project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                affiliations: 1,
            }},
            {$match: { $or: [
                { firstName: { $regex }},
                { lastName: { $regex }},
                { email: { $regex }},
            ]}},
        ])
    
        res.json({ data })
    })

    router.put('/person', async (req, res) => {
        const controller = new PersonController()
        await controller.put(req, res)
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
        try {
            const institution = new Institution({
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

