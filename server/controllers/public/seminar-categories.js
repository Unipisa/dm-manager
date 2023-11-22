const SeminarCategory = require('../../models/SeminarCategory')

async function seminarCategoriesQuery(req) {
    // Filters setup
    match = {}
    req.query.name && ( match["name"] = req.query.name )

    const pipeline = [
        { $match: match },
        { $project: {
            _id: 1, 
            name: 1
        }}
    ]

    const categories = await SeminarCategory.aggregate(pipeline)

    return {
        data: categories
    }
}

module.exports = seminarCategoriesQuery