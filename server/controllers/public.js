const Staff = require('../models/Staff')

async function staffQuery(req) {
    const matches = []

    if (req.query.email) {
        matches.push({$match: {
            $or: [
                { 'person.email': req.query.email },
                { 'person.alternativeEmail': req.query.email }
            ]
        }})
    }

    if (req.query.matricola) {
        matches.push({$match: {
            'matricola': req.query.matricola
        }})
    }

    const pipeline = [
        // filter by startDate, endDate containing today
        {
            $match: {
                $expr: {
                    $and: [
                        { $or: [
                            { $eq: ["$endDate", null] },
                            { $gte: ["$endDate", "$$NOW"] } ]},
                        { $or: [
                            { $eq: ["$startDate", null] },
                            { $lte: ["$startDate", "$$NOW"] } ]}
                    ]},
            },
        },
        // lookup person
        {
            $lookup: {
                from: 'people',
                localField: 'person',
                foreignField: '_id',
                as: 'person',
                pipeline: [
                    {$lookup: {
                        from: 'institutions',
                        localField: 'affiliations',
                        foreignField: '_id',
                        as: 'affiliations'
                    }},
                ]
            }
        },
        // expand person array
        {
            $unwind: {
                path: '$person',
                preserveNullAndEmptyArrays: true
            }
        },
        ...matches,
        {
            $project: {
                person: {
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
                },
                qualification: 1,
                photoUrl: 1,
                isInternal: 1,
                _id: 0,
            }
        }
    ]

    console.log(JSON.stringify({pipeline}))

    const staffs = await Staff.aggregate(pipeline)

    if (!staffs || staffs.length === 0) {
        return {
            error: 'no match'
        }
    }
    if (staffs.length > 1) {
        return {
            error: 'multiple matches'
        }
    }
    return staffs[0]
}

module.exports.staffQuery = staffQuery

