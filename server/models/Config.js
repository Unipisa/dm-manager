const mongoose = require('mongoose')
// expect a single document in this collection
module.exports = mongoose.model('Config', {
    migrations: [String],
    notifications: {
        visits: [String],
        seminars:[String],
    },
 })
