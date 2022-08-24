const mongoose = require('../mongoose').mongoose
const passportLocalMongoose = require('passport-local-mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    username: String,
 });

userSchema.plugin(passportLocalMongoose)

exports.User = mongoose.model('Users', userSchema);
