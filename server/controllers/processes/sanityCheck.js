const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const Person = require('../../models/Person')
const {log} = require('../middleware')
const { readSync } = require('fs-extra')

router.get('/', async (req, res) => {    
    if (req.user === undefined || !req.user.roles.includes('admin')) {
        return res.status(401).json({
            result: "Unauthorized"
        })
    }

    // find duplicated names
    const duplicatedNames = await Person.aggregate([
        {
            $group: {
                _id: { lastName: "$lastName", firstName: "$firstName" },
                ids: { $push: "$_id" },
                count: { $sum: 1 }
            }
        },
        {
            $match: {
                count: { $gt: 1 }
            }
        }
    ])

    // find duplicated emails and alternativeEmails
    const duplicatedEmails = await Person.aggregate([
        { $project: {
            emails: {
                $concatArrays: [ ["$email"], "$alternativeEmails" ]
            }
        }},
        { $unwind: "$emails" },
        { $match: {emails: { $ne: "" }}},
        { $match: {emails: { $ne: null }}},
        {
            $group: {
                _id: { email: "$emails" },
                ids: { $push: "$_id" },
                count: { $sum: 1 }
            }
        },
        {
            $match: {
                count: { $gt: 1 }
            }
        }
    ])

    return res.json({duplicatedNames, duplicatedEmails})
})

module.exports = router