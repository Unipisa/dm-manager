const Grant = require('../../models/Grant')
const { escapeRegExp } = require('../Controller')

module.exports = (router) => {
    router.get('/grant/search', async (req, res) => {
        const $regex = new RegExp(escapeRegExp(req.query.q), 'i')
        const data = await Grant.aggregate([
            { $lookup: {
                from: 'people',
                localField: 'pi',
                foreignField: '_id',
                as: 'pi',
                pipeline: [
                    { $project: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                    }},
                ]
            }},/*
            { $match: {
                startDate: { $lte: "$$NOW" },
                endDate: { $gte: "$$NOW" },
            }},*/
            { $match: { $or: [
                { name: { $regex }},
                { code: { $regex }},
                { 'pi.lastName': { $regex }},
            ]}},
            { $project: {
                _id: 1,
                name: 1,
                identifier: 1,
                pi: 1,
            }},
        ])
        res.json({ data })
    })
}