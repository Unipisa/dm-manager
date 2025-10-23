const { Schema, model } = require('./Model')
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new Schema({
    firstName: {type: String, label: 'nome'},
    lastName: {type: String, label: 'cognome'},
    email: {type: String, label: 'email'},
    username: {type: String, label: 'username', help: 'corrisponde all\'email per gli utenti autenticati con credenziali di ateneo'},
    roles: {
      type: [{type: String}],
      label: 'ruoli',
      help: `i ruoli assegnabili sono: 
        admin, 
        /process/visits, /process/seminars, /process/conferences, 
        /process/visitsList, process/roomLabels, process/roomAssignmentsList, 
        notify/admin, notify/portineria, notify/process/visits, notify/process/conferences, notify/process/roomLabels`
    },
    person: {type: Schema.Types.ObjectId, ref: 'Person', label: 'persona', null: true, default: null},
 }, { timestamps: true })

userSchema.plugin(passportLocalMongoose)

// specify the transform schema option
if (!userSchema.options.toObject) userSchema.options.toObject = {}
userSchema.options.toObject.transform = function (doc, ret, options) {
  ret.id = ret._id.toString()
  delete ret._id
  delete ret.__v
  delete ret.hash
  delete ret.salt
  return ret
}

module.exports = model('User', userSchema)
