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
                _id: { lastName: { $toLower: "$lastName" }, firstName: { $toLower: "$firstName" } },
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
                _id: { email: { $toLower: "$emails" } },
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

    // find persons with trailing spaces
    const personsWithTrailingSpaces = await Person.aggregate([
        {
            $match: {
                $or: [
                    { firstName: { $regex: /\s+$/, $options: "s" } },
                    { lastName: { $regex: /\s+$/, $options: "s" } },
                    { email: { $regex: /\s+$/, $options: "s" } },
                    { alternativeEmails: { $regex: /\s+$/, $options: "s" } }
                ]
            }
        }
    ]);

    // find institutions with trailing spaces
    const institutionsWithTrailingSpaces = await Institution.aggregate([
        {
            $match: {
                $or: [
                    { name: { $regex: /\s+$/, $options: "s" } },
                    { country: { $regex: /\s+$/, $options: "s" } },
                    { city: { $regex: /\s+$/, $options: "s" } },
                    { code: { $regex: /\s+$/, $options: "s" } }
                ]
            }
        }
    ]);

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

    // find duplicated seminars
    const duplicatedSeminars = await Seminar.aggregate([
        {
            $facet: {
                byTitle: [
                    {
                        $match: {
                            $expr: { 
                                $ne: [{ $toLower: "$title" }, "tba"]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: { title: { $toLower: "$title" } },
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
                        $match: {
                            conferenceRoom: { $exists: true, $ne: "" }
                        }
                    },
                    {
                        $group: {
                            _id: { startDate: "$startDatetime", conferenceRoom: "$conferenceRoom" },
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

    // find duplicated events
    const duplicatedEvents = await Event.aggregate([
        {
            $facet: {
                byTitle: [
                    {
                        $match: {
                            $expr: { 
                                $ne: [{ $toLower: "$title" }, "tba"]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: { title: { $toLower: "$title" } },
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

    return res.json({duplicatedNames, personsWithTrailingSpaces, institutionsWithTrailingSpaces, duplicatedEmails, missingMatricola, missingSSD, missingInstitutionCountry, duplicatedInstitutions, duplicatedSeminars, duplicatedEvents})
})

module.exports = router