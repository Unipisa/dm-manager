const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const Person = require('../../models/Person')
const {log} = require('../middleware')
const { readSync } = require('fs-extra')
const Staff = require('../../models/Staff')
const Institution = require('../../models/Institution')
const Seminar = require('../../models/EventSeminar')
const Event = require('../../models/EventConference')

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

    // find missing matricola
    const missingMatricola = await Staff.aggregate([
        {
            $match: {
                isInternal: true,
                $or: [
                    { matricola: { $exists: false } },
                    { matricola: "" } 
                ],
                startDate: { $lt: new Date() }
            }
        }
    ])

    // find missing SSD
    const missingSSD = await Staff.aggregate([
        {
            $match: {
                isInternal: true,
                $or: [
                    { SSD: { $exists: false } },
                    { SSD: "" } 
                ],
                startDate: { $lt: new Date() },
                qualification: { $ne: 'PTA' }
            }
        }
    ])

    // find institutions with missing country
    const missingInstitutionCountry = await Institution.aggregate([
        {
            $match: {
                $or: [
                    { country: { $exists: false } }, 
                    { country: "" }
                ]
            }
        }
    ])

    // find duplicated institutions
    const duplicatedInstitutions = await Institution.aggregate([
        { $project: {
            names: { $concatArrays: [ ["$name"], "$alternativeNames" ] },
          }
        },
        { $unwind: "$names" },
        { $match: { names: { $ne: "" } } },
        { $match: { names: { $ne: null } } },
        {
            $group: {
                _id: { name: { $toLower: "$names" } },
                ids: { $push: "$_id" },
                count: { $sum: 1 }
            }
        },
        {   $match: { 
                count: { $gt: 1 } 
            } 
        }
    ]);

    const duplicatedSeminars = await Seminar.aggregate([
        {
            $facet: {
                byTitle: [
                    {
                        $group: {
                            _id: { $toLower: "$title" },
                            ids: { $push: "$_id" },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $match: {
                            count: { $gt: 1 }
                        }
                    }
                ],
                bySpeakersAndDate: [
                    {
                        $group: {
                            _id: { speakers: "$speakers", startDatetime: "$startDatetime" },
                            ids: { $push: "$_id" },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $match: {
                            count: { $gt: 1 }
                        }
                    }
                ],
                byDateAndRoom: [
                    {
                        $group: {
                            _id: { startDatetime: "$startDatetime", conferenceRoom: "$conferenceRoom" },
                            ids: { $push: "$_id" },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $match: {
                            count: { $gt: 1 }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                duplicatedSeminars: { $concatArrays: ["$byTitle", "$bySpeakersAndDate", "$byDateAndRoom"] }
            }
        },
        {
            $unwind: "$duplicatedSeminars"
        },
        {
            $replaceRoot: { newRoot: "$duplicatedSeminars" }
        }
    ])

    const duplicatedEvents = await Event.aggregate([
        {
            $facet: {
                byTitle: [
                    {
                        $group: {
                            _id: { $toLower: "$title" },
                            ids: { $push: "$_id" },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $match: {
                            count: { $gt: 1 }
                        }
                    }
                ],
                byDateAndRoom: [
                    {
                        $match: {
                            conferenceRoom: { $exists: true, $ne: "" }
                        }
                    },
                    {
                        $group: {
                            _id: { startDate: "$startDate", conferenceRoom: "$conferenceRoom" },
                            ids: { $push: "$_id" },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $match: {
                            count: { $gt: 1 }
                        }
                    }
                ],
                byDateAndInstitution: [
                    {
                        $match: {
                            institution: { $exists: true, $ne: "" }
                        }
                    },
                    {
                        $group: {
                            _id: { startDate: "$startDate", institution: "$institution" },
                            ids: { $push: "$_id" },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $match: {
                            count: { $gt: 1 }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                duplicatedEvents: { $concatArrays: ["$byTitle", "$byDateAndRoom", "$byDateAndInstitution"] }
            }
        },
        {
            $unwind: "$duplicatedEvents"
        },
        {
            $replaceRoot: { newRoot: "$duplicatedEvents" }
        }
    ])

    return res.json({duplicatedNames, duplicatedEmails, missingMatricola, missingSSD, missingInstitutionCountry, duplicatedInstitutions, duplicatedSeminars, duplicatedEvents})
})

module.exports = router