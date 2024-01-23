const mongoose = require('mongoose')
const fs = require('fs')

const config = require('./config')
const migrations = require('./migrations')
const MongoStore = require('connect-mongo')
const crypto = require('crypto')

const User = require('./models/User')
const Token = require('./models/Token')

async function createOrUpdateUser({
    username, 
    password,
    roles, }) {
  if (!username) throw new Error("username is required")

  let user = await User.findOne({ username })
  if (!user) {
    user = await User.create({ 
      username, 
      lastName: username,
      firstName: username,
      email: `${username}@nomail.com`,
    })
    console.log(`Created new user ${user.username}`)
  } else {
      console.log(`Found user: ${user.username}`)
  }
  if (password) {
      await user.setPassword(password)
      await user.save()
      console.log(`Password of user ${user.username} reset (password is ${password.length} characters long)`)
  }

  for (let role of roles) {
    if (!user.roles.includes(role)) {
      user.roles.push(role)
      await user.save()
      console.log(`Added role ${role} to user ${user.username}`)
    } else {
      console.log(`User ${user.username} already has role ${role}`)
    }
  } 

  return user
}

async function create_admin_user() {
  const username = config.ADMIN_USER
  const password = config.ADMIN_PASSWORD
  
  if (username) {
    const admin = createOrUpdateUser({
      username,
      password,
      roles: ['admin'],
    })
    if (password) {
        console.log(`Password reset for user "${admin.username}"`)
    } else {
      console.log(`Password not provided (set ADMIN_PASSWORD)`)
    }
  }

  const n = await User.countDocuments({})
  if ( n == 0) {
    console.log(`No users in database. Create one by setting ADMIN_USER and ADMIN_PASSWORD`)
  }
}

async function create_secret_token() {
  const secret = config.TOKEN_SECRET
  if (!secret) {
    console.log(`No secret token created. Use web interface to create your first token or set SECRET_TOKEN`)
    return
  }
  const name = 'automatic-secret-token'

  let token = await Token.findOne({name})
  if (token) {
    token.token = secret 
    token.roles = ['admin']
    token.save()
    console.log(`updated existing Token: "${name}" with provided TOKEN_SECRET`)
  } else {
    token = await Token.create({
      name,
      token: secret,
      roles: ['admin'],
    })
    console.log(`create new Token: "${name}" with provided TOKEN_SECRET`)
  }
}

async function setupDatabase() {
  if (process.env.NODE_ENV === 'test') {
    try {
      await mongoose.connect(config.MONGO_TEST_URI)
    } catch(error) {
      console.log(`Unable to connect to database: ${config.MONGO_URI_TEST}`)
      return null
    }
    return mongoose.connection
  }
  console.log(`connecting to database: ${config.MONGO_URI}`)
  try {
    await mongoose.connect(config.MONGO_URI)
  } catch(error) {
    console.log(`ERROR: unable to connect to database... quitting`)
    process.exit(1)
  }
  console.log('MongoDB is connected')
  return mongoose.connection
}

module.exports = {
  setupDatabase,
  createOrUpdateUser,
  create_admin_user,
  create_secret_token,
}
 