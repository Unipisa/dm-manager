const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    username: String,
    roles: [String]
 })

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

module.exports = mongoose.model('User', userSchema)
