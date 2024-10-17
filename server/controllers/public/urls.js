const Url = require('../../models/Url')

async function urlsQuery(req, res) {
    // Find all urls (aliases) of web pages with index flag 
    const urls = await Url.aggregate([
        {$match: {
            index: true,
        }},
        {$project: {
            _id: 1, 
            alias: 1,
            destination: 1,
        }},
    ])

    return { 
        data: urls
    }
}

module.exports = urlsQuery