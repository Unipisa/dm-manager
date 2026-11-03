const Thesis = require('../../models/Thesis')
const Controller = require('../Controller')

const { createSortAndLimitFilters } = require('./common-filters')

const shortcodeController = new Controller()
shortcodeController.Model = Thesis
shortcodeController.path = 'public/theses'
shortcodeController.fields = Object.fromEntries([
    'person', 'title', 'advisors', 'date', 'institutions', 'fileUrl', 'SSD',
].map(field => [field, Thesis._schema_info.properties[field]]))
shortcodeController.searchFields = ['title', 'person.lastName', 'person.firstName', 'institutions.name']

async function thesesQuery(req, res) {
    const shortcode = req.query._format === 'shortcode'
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

    const sort_and_limit = shortcode ? [] : createSortAndLimitFilters(req)

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
                {$lookup: {
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
                        ...(shortcode ? [{ $project: { _id: 0, qualification: 1, isInternal: 1 } }] : []),
                    ]
                }},
                {$project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    affiliations: {
                        _id: 1,
                        name: 1
                    },
                    staff: {
                        qualification: 1,
                        isInternal: 1
                    },
                    ...(shortcode ? { staffs: '$staff' } : {}),
                }}
            ]
        }},
        { $lookup: {
            from: 'institutions',
            foreignField: '_id',
            localField: 'institutions',
            as: 'institutions'
        }},
        // Older records may contain the singular affiliation used in PHP list mode.
        ...(shortcode ? [
            { $lookup: {
                from: 'institutions', localField: 'affiliation', foreignField: '_id', as: 'affiliation',
                pipeline: [{ $project: { name: 1 } }],
            } },
            { $unwind: { path: '$affiliation', preserveNullAndEmptyArrays: true } },
        ] : []),
        ...sort_and_limit,
        { $project: {
            _id: 1, 
            title: 1, 
            person: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                ...(shortcode ? { genealogyId: 1, email: 1, phone: 1 } : {}),
                staff: {
                    qualification: 1,
                    isInternal: 1
                }
            },
            advisors: 1,
            date: 1,
            institutions: {
                _id: 1,
                name: 1
            },
            SSD: 1,
            ...(shortcode ? { affiliation: { name: 1 }, fileUrl: 1 } : {}),
        }}
    ]

    if (shortcode) {
        const { _format, ...query } = req.query
        return shortcodeController.performQuery({ _sort: 'person', ...query }, res, {
            queryPipeline: pipeline.slice(1),
        })
    }

    const theses = await Thesis.aggregate(pipeline)

    return {
        data: theses
    }
}

module.exports = thesesQuery
