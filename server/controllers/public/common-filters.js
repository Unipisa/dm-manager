function createSortAndLimitFilters(req) {
    var filters = []
    if (req.query._sort) {
        sort = {}
        // We use the special syntax field for ascending, -field for descending
        if (req.query._sort[0] == '-') {
            sort[req.query._sort.slice(1)] = -1
        }
        else {
            sort[req.query._sort] = 1
        }
        filters = [{ $sort: sort }]
    }

    if (req.query._limit) {
        filters.push({
            $limit: parseInt(req.query._limit)
        })
    }
    else {
        filters.push({
            $limit: 10
        })
    }

    return filters
}

module.exports = { createSortAndLimitFilters }