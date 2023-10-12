const Staff = require('../models/Staff')
const Person = require('../models/Person')

async function staffQuery(req) {
    const matches = []

    if (req.query.email) {
        matches.push({$match: {
            $or: [
                { 'email': req.query.email },
                { 'alternativeEmails': req.query.email },
            ]
        }})
    }

    if (req.query.matricola) {
        matches.push({$match: {
            'staff.matricola': req.query.matricola
        }})
    }

    const pipeline = [
        {
            $lookup: {
                from: 'staffs',
                localField: '_id',
                foreignField: 'person',
                as: 'staff',
                pipeline: [
                    {$match: {
                        $expr: {
                            $and: [
                                { $or: [
                                    { $eq: ["$endDate", null] },
                                    { $gte: ["$endDate", "$$NOW"] } ]},
                                { $or: [
                                    { $eq: ["$startDate", null] },
                                    { $lte: ["$startDate", "$$NOW"] } ]}
                            ]},
                    }},
                ]
            }
        },
        // remove entries with empty staff
        {
            $match: {
                'staff.0': {$exists: true}
            }
        },
        ...matches,
        {$lookup: {
            from: 'institutions',
            localField: 'affiliations',
            foreignField: '_id',
            as: 'affiliations'
        }},
        {
            $project: {
                _id: 0,
                firstName: 1,
                lastName: 1,
                gender: 1,
                email: 1,
                phone: 1,
                personalPage: 1,
                mathscinet: 1,
                google_scholar: 1,
                orcid: 1,
                photoUrl: 1,
                country: 1,
                arxiv_orcid: 1,
                affiliations: {
                    name: 1,
                },
                alternativeEmails: 1,
                staff: {
                    qualification: 1,
                    photoUrl: 1,
                    isInternal: 1,
                }
            }
        }
    ]

    // console.log(JSON.stringify({pipeline}))

    const staffs = await Person.aggregate(pipeline)

    if (!staffs || staffs.length === 0) {
        return {
            error: 'no match'
        }
    }
    if (staffs.length > 1) {
        console.log(JSON.stringify({staffs}))
        return {
            error: 'multiple matches'
        }
    }
    return staffs[0]
}

module.exports.staffQuery = staffQuery

