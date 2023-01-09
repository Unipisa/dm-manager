const { Schema, model } = require('./Model')
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new Schema({
    firstName: {type: String, label: 'cognome'},
    lastName: {type: String, label: 'nome'},
    email: {type: String, label: 'email'},
    username: {type: String, label: 'username'},
    roles: [{type: String, label: 'ruoli'}],
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
