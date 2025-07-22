const ObjectId = require('mongoose').Types.ObjectId
const Thesis = require('../../models/Thesis')

const { createSortAndLimitFilters } = require('./common-filters')

async function thesesQuery(req) {
    var match = {}
    
    if (req.query.year !== undefined) {
        const year = parseInt(req.query.year);
        
        const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
        
        match["date"] = {
            "$gte": startOfYear,
            "$lte": endOfYear
        };
    }

    if (req.query.ssd) {
        match["SSD"] = req.query.ssd
    }

    const sort_and_limit = createSortAndLimitFilters(req)

    const pipeline = [
        { $match: match },
        { $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'person',
        }},
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'staffs',
            localField: 'person._id',
            foreignField: 'person',
            as: 'person.staff',
            pipeline: [
                { $match: {
                    qualification: { $regex: "Dottorando", $options: "i" } 
                }},
            ]
        }},
         { $lookup: {
            from: 'people',
            localField: 'advisors',
            foreignField: '_id',
            as: 'advisors',
            pipeline: [
                {$sort: { 'lastName': 1 }},
                {$lookup: {
                    from: 'institutions',
                    localField: 'affiliations',
                    foreignField: '_id',
                    as: 'affiliations'
                }},
                {$project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    affiliations: {
                        _id: 1,
                        name: 1
                    }
                }}
            ]
        }},
        { $lookup: {
            from: 'institutions',
            foreignField: '_id',
            localField: 'institution',
            as: 'institution'
        }},
        { $unwind: {
            path: '$institution',
            preserveNullAndEmptyArrays: true
        }},
        ...sort_and_limit,
        { $project: {
            _id: 1, 
            title: 1, 
            person: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                staff: {
                    qualification: 1,
                    isInternal: 1
                }
            },
            advisors: 1,
            date: 1,
            institution: {
                _id: 1,
                name: 1
            },
            SSD: 1
        }}
    ]

    const theses = await Thesis.aggregate(pipeline)

    return {
        data: theses
    }
}

module.exports = thesesQuery
