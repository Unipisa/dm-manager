const mongoose = require('mongoose')

module.exports = mongoose.model('Log', {
    who: String,
    when: Date,
    what: String,
    where: String,
    was: Object,
    will: Object,
 })
