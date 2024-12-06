const Visit = require('../../models/Visit')
const { personRoomAssignmentPipeline } = require('../../models/RoomAssignment')

const { createSortAndLimitFilters } = require('./common-filters')

async function visitsQuery(req) {
    // restituisce le visite correnti se from e to non specificati
    // si può filtrare sull'email

    var from = undefined;
    switch (req.query.from) {
        case 'now':
            from = new Date();
            break;
        case undefined:
            from = undefined;
            break;
        default:
            from = new Date(req.query.from);
    }
    
    var to = undefined;
    switch (req.query.to) {
        case 'now':
            to = new Date();
            break;
        case undefined:
            to = undefined;
            break;
        default:
            to = new Date(req.query.to);
    }
    
    var match = {};
    
    if (from !== undefined || to !== undefined) {
        if (from !== undefined) {
            match["endDate"] = { "$gte": from };
        }
        if (to !== undefined) {
            match["startDate"] = { "$lte": to };
        }
    } else {
        match = {
            $expr: {
                $and: [
                    {
                        $or: [
                            { $eq: ["$endDate", null] },
                            { $gte: ["$endDate", { $dateAdd: { startDate: "$$NOW", unit: "day", amount: -1 } }] }
                        ]
                    },
                    {
                        $or: [
                            { $eq: ["$startDate", null] },
                            { $lte: ["$startDate", "$$NOW"] }
                        ]
                    }
                ]
            }
        };
    }

    const matches = []
    if (req.query.email) {
        matches.push({ 'person.email': req.query.email },
            { 'person.alternativeEmails': req.query.email })
    }

    const sort_and_limit = createSortAndLimitFilters(req)

    const pipeline = [
        {$match: match },
        { $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'person',
        }},
        ...(matches.length > 0 ? [{
            $match: {
                $or: matches,
            }
        }] : []),
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true
        }},
        ...personRoomAssignmentPipeline(),
        {$lookup: {
            from: 'institutions',
            localField: 'person.affiliations',
            foreignField: '_id',
            as: 'person.affiliations',
            pipeline: [
                {$project: {
                    _id: 1,
                    name: 1,
                    code: 1,
                    city: 1,
                    country: 1,
                }}
            ]
        }},
        ...sort_and_limit,
        { $project: {
            _id: 0,
            startDate: 1,
            endDate: 1,
            affiliations: 1,
            person: {
                firstName: 1,
                lastName: 1,
                affiliations: {
                    name: 1
                }
            },
            roomAssignment: {
                room: {
                    building: 1,
                    floor: 1,
                    number: 1,
                }
            },
        }},
    ]

    const visits = await Visit.aggregate(pipeline)

    return {
        data: visits
    }
}

module.exports = visitsQuery
