const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const session = require('express-session')
const passport = require('passport')
const mongoose = require('mongoose')
const LocalStrategy = require('passport-local')
const fs = require('fs')

const User = require('./models/User')
const config = require('./config')
const UnipiAuthStrategy = require('./unipiAuth')
const api = require('./api')

// local password authentication
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// unipi oauth2 authentication
if (config.OAUTH2_CLIENT_ID) {
  passport.use(new UnipiAuthStrategy({
    authorizationURL: config.OAUTH2_AUTHORIZE_URL,
    tokenURL: config.OAUTH2_TOKEN_URL,
    clientID: config.OAUTH2_CLIENT_ID,
    clientSecret: config.OAUTH2_CLIENT_SECRET,
    callbackURL: `${config.SERVER_URL}/login/oauth2/callback`,
    usernameField: config.OAUTH2_USERNAME_FIELD,
  }))
} else {
  console.log("OAUTH2 authentication disabled")
  console.log("set OAUTH2_CLIEND_ID to enable")
}

const app = express()

app.use(cors(
  {
    origin: config.CORS_ORIGIN.split(","),
    optionsSuccessStatus: 200,
    credentials: true // Needed for the client to handle session
  }))

app.use(morgan('tiny')) // access log

const test_filename = `${config.STATIC_FILES_PATH}/manifest.json`
if (!fs.existsSync(test_filename)) {
  console.log(`WARNING: cannot stat ${test_filename}`)
  console.log(`cwd: ${process.cwd()}`)
}
app.use(express.static(config.STATIC_FILES_PATH))

app.use(express.json()) // parse request data into req.body

app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.authenticate('session'))

app.use('/api/v0', api)

app.get('/config', (req, res) => {
  const user = req.user || null
  res.send({
    VERSION: config.VERSION,
    OAUTH2_ENABLED: !!config.OAUTH2_CLIENT_ID,
    user
  })
})

app.post('/login', function(req, res) {
  const user = req.user || null
  res.send({ user })
})

app.post('/login/password',
  passport.authenticate('local'),
  function(req, res) {
    console.log(`login/password body: ${req.body}`)
    const user = req.user.toObject()
    console.log(`login ${JSON.stringify(user)}`)
    res.send({ user })
  })

if (config.OAUTH2_CLIENT_ID) {
  app.get('/login/oauth2',
    passport.authenticate('oauth2'))
}

app.get('/login/oauth2/callback',
  passport.authenticate('oauth2'),
  function(req, res) {
    const user = req.user.toObject()
    console.log(`login ${JSON.stringify(user)}`)
    res.redirect(config.SERVER_URL || `http://localhost:3000`)
  }
)

app.post('/logout', function(req, res){
  req.logout(function(err) {
    if (err) { return next(err) }
    // res.redict('/login')
    res.send({ "user": null })
  })
})

app.post('/impersonate', function(req, res) {
  const role = req.body.role
  if (role) {
    if (req.user && req.user.roles && (req.user.roles.includes('admin') || req.user.roles.includes('disguised-admin'))) {
      const roles = role === 'admin' ? [role] : [role, 'disguised-admin']
      User.findByIdAndUpdate(req.user._id, { roles }, (err, result) => {
        if (err) {
          res.status('500')
          res.send({error: err.message})
          console.error(err)
        } else {
          console.log(`user disguised as ${role}`)
          req.user = result
          res.send(req.user.toObject())
        }
      })
    } else {
      res.status("403")
      res.send({error: "'admin' or 'disguised-admin' role needed for this operation"})
    }
  } else {
    res.status("300")
    res.send({error: "specify 'role' in json request body"})
  }
})

app.get('/hello', (req, res) => {
  console.log(`params: ${JSON.stringify(req.params)}`)
  console.log(`query: ${JSON.stringify(req.query)}`)
  console.log(`body: ${JSON.stringify(req.body)}`)
  console.log(`session: ${JSON.stringify(req.session)}`)
  console.log(`user: ${JSON.stringify(req.user)}`)
  console.log(`isAuthenticated: ${req.isAuthenticated()}`)
  res.send('Hello World!')
})

// all unhandled requests are sent to the react application
app.all('*', function(req, res) {
  res.sendFile(`${config.STATIC_FILES_PATH}/index.html`, { 
    root: `${__dirname}/../` })
})

// gestisci errori
app.use((err, req, res, next) => {
  res.status(500).send({ error: "internal server error" })
  console.log("ERROR CATCHED!")
  console.error(err)
})

async function create_admin_user() {
  const username = config.ADMIN_USER
  const password = config.ADMIN_PASSWORD
  
  if (username) {
    let admin = await User.findOne({ username })
    if (!admin) {
      admin = await User.create({ 
        username, 
        lastName: "Admin",
        firstName: "Admin",
        roles: ['admin'] 
      })
      console.log(`Create user "${admin.username}"`)
    }
    if (password) {
        await admin.setPassword(password)
        await admin.save()
        console.log(`Password reset for user "${admin.username}"`)
    } else {
      console.log(`Password not provided (set ADMIN_PASSWORD)`)
    }
    if (!admin.roles || !admin.roles.includes('admin')) {
      admin.roles.push('admin')
      await admin.save()
    }
    if (!admin.lastName) {
      admin.lastName = "Admin"
      admin.firstName = "Admin"
      await admin.save()
    }
  }
  const n = await User.countDocuments({})
  if ( n == 0) {
    console.log(`No users in database. Create one by setting ADMIN_USER and ADMIN_PASSWORD`)
  }
}

async function main() {
  console.log("options (configure using environment variables or .env file):")
  for(let [key, val] of Object.entries(config)) {
    if (key.search(/SECRET|PASSWORD/) >= 0) val = "*****"
    console.log(`  ${key}: ${val}`)
  }
  console.log(`connecting to database: ${config.MONGO_URI}`)
  try {
    await mongoose.connect(config.MONGO_URI)
  } catch(error) {
    console.log(`ERROR: unable to connect to database... quitting`)
    process.exit(1)
  }
  console.log('MongoDB is connected')

  create_admin_user()

  app.listen(parseInt(config.PORT), () => {
    console.log(`server started: ${config.SERVER_URL}`)
  })
}

main()
