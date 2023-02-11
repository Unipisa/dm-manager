const { model, Schema } = require('./Model')

module.exports = model('Log', new Schema({
    who: {type: String},
    when: {type: Date},
    what: {type: String},
    where: {type: String},
    was: {type: Object},
    will: {type: Object},
 }))
