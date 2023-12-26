const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const session = require('express-session')
const passport = require('passport')
const mongoose = require('mongoose')
const LocalStrategy = require('passport-local')
const fs = require('fs')

const User = require('./models/User')
const Person = require('./models/Person')
const Token = require('./models/Token')
const config = require('./config')
const UnipiAuthStrategy = require('./unipiAuth')
const api = require('./api')
const migrations = require('./migrations')
const MongoStore = require('connect-mongo')
const crypto = require('crypto')

// local password authentication
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// unipi oauth2 authentication
if (config.OAUTH2_CLIENT_ID) {
  console.log(`OAUTH2 authentication enabled for CLIENT_ID ${config.OAUTH2_CLIENT_ID}`)

  const oauthStrategy = new UnipiAuthStrategy({
    authorizationURL: config.OAUTH2_AUTHORIZE_URL,
    tokenURL: config.OAUTH2_TOKEN_URL,
    clientID: config.OAUTH2_CLIENT_ID,
    clientSecret: config.OAUTH2_CLIENT_SECRET,
    callbackURL: `${config.BASE_URL}/login/oauth2/callback`,
    usernameField: config.OAUTH2_USERNAME_FIELD,
  })

  passport.use(oauthStrategy)
} else {
  console.log("OAUTH2 authentication disabled")
  console.log("set OAUTH2_CLIENT_ID to enable")
}

function setup_routes(app) {
  app.use(cors(
    {
      origin: "*",
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
  
  app.use(express.json({limit: '50mb'})) // parse request data into req.body
  
  app.use(session({
    secret: config.SESSION_SECRET,
    cookie: { maxAge: 2628000000 },
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: config.MONGO_DB,
      collectionName: "sessions",
      stringify: false,
      autoRemove: "interval",
      autoRemoveInterval: 30
    })
  }))
  
  app.use(passport.session())

  app.use(async (req, res, next) => {
    const user = req.user
    if (user && user.email) {
      /* attach roles to user */
      const persons = await Person.aggregate([
        { $match: {$or: [
          {email: user.email }, 
          {alternativeEmails: user.email}] }
        },
        {
          $lookup: {
            from: 'staffs',
            let: { person_id: '$_id'},
            pipeline: [
              { $match: {
                  $expr: { 
                    $and: [
                      { $eq: [ '$person', '$$person_id' ]},
                      { $or: [ {$eq: ['$startDate', null]}, {$lte: ['$startDate', '$$NOW']}]},
                      { $or: [ {$eq: ['$endDate', null]}, {$gte: ['$endDate', '$$NOW']}]},
                    ]
                  }
                }
              }
            ],
            as: 'staff',
          }
        }, 
        {
          $unwind: {
            path: '$staff',
            preserveNullAndEmptyArrays: false,
          }
        }
      ])
      const isInternal = persons.reduce((acc, person) => acc || person.staff.isInternal, false)
      if (isInternal) user.roles.push('/api/v0/process/seminars')
      console.log(`sending user ${JSON.stringify(user)}`)
    }

    next()
  })
  
  app.use(config.API_PATH, api)
  
  app.get('/config', (req, res) => {
    const user = req.user || null
    res.send({
      SERVER_NAME: config.SERVER_NAME,
      VERSION: config.VERSION,
      OAUTH2_ENABLED: !!config.OAUTH2_CLIENT_ID,
      user,
    })
  })
  
  app.post('/login', async function(req, res) {
    const user = req.user || null
    res.send({ user })
  })
  
  app.post('/login/password',
    passport.authenticate('local', {
        keepSessionInfo: true
    }),
    function(req, res) {
      const user = req.user.toObject()
      console.log(`login ${user.username} roles: ${user.roles}`)
      res.send({ user })
    })
  
  if (config.OAUTH2_CLIENT_ID) {
    app.get('/login/oauth2', (req, res, next) => {
        const db = mongoose.connection.db
        const redirects = db.collection('redirects')
        const state = crypto.randomUUID()
        const now = Date.now()

        redirects.deleteMany({ timestamp: { $lt: now - 3600 * 1000 }}).then(() => {
            redirects.insertOne({
                state, next: req.query.next, timestamp: now
            }).then(() => {
                const pcb = passport.authenticate('oauth2', { state })
                pcb(req, res, next)
            })
        })
    })
    
  }
  
  app.get('/login/oauth2/callback',
    passport.authenticate('oauth2'),
    function(req, res) {
      const db = mongoose.connection.db
      const redirects = db.collection('redirects')

      redirects.findOne({
        state: req.query.state
      }).then((document) => {
        const next = document.next
        res.redirect(next ?? '/')
      }).catch(() => {
        res.redirect(next ?? '/')
      })
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
    if (role || role==='') {
      if (req.user && req.user.roles && (req.user.roles.includes('admin') || req.user.roles.includes('disguised-admin'))) {
        // user want to add role
        // if role is admin it is the only role we need
        // if role is '' we remove all roles
        // otherwise remove admin and add disguised-admin
        let roles = role==='' ? [] : [role]
        if (role !== 'admin') {
          if (role !== '') roles.push(...req.user.roles)
          roles = roles.filter(x => x!=='admin')
          if (!roles.includes('disguised-admin')) roles.push('disguised-admin')
        }
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
  app.get('*', function(req, res) {
    res.sendFile(`${config.STATIC_FILES_PATH}/index.html`, { 
      root: `${__dirname}/../` })
  })
  
  // gestisci errori
  app.use((err, req, res, next) => {
    res.status(500).send({ error: "internal server error" })
    console.log("ERROR CATCHED!")
    console.error(err)
  })
}

async function createOrUpdateUser({
    username, 
    password,
    lastName,
    firstName, 
    email, 
    roles, }) {
  if (!username) throw new Error("username is required")
  if (!lastName) lastName = username
  if (!firstName) firstName = username
  if (!roles) roles = []

  let user = await User.findOne({ username })
  if (!user) {
    user = await User.create({ 
      username, 
      lastName,
      firstName,
      email,
      roles,
    })
  } else {
    await User.findByIdAndUpdate(user._id, {
      username,
      lastName,
      firstName,
      email,
      roles,
      })
  }
  if (password) {
      await user.setPassword(password)
      await user.save()
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

function createApp() {
  const app = express()
  setup_routes(app)
  return app
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

async function serve() {
  console.log(`
 ___    ___ ___         ___ ___   ____  ____    ____   ____    ___  ____  
|   \\  |   |   |       |   |   | /    ||    \\  /    | /    |  /  _]|    \\ 
|    \\ | _   _ | _____ | _   _ ||  o  ||  _  ||  o  ||   __| /  [_ |  D  )
|  D  ||  \\_/  ||     ||  \\_/  ||     ||  |  ||     ||  |  ||    _]|    / 
|     ||   |   ||_____||   |   ||  _  ||  |  ||  _  ||  |_ ||   [_ |    \\ 
|     ||   |   |       |   |   ||  |  ||  |  ||  |  ||     ||     ||  .  \\
|_____||___|___|       |___|___||__|__||__|__||__|__||___,_||_____||__|\\_|
  `)
                                                                          
  console.log(`${new Date}`)
  console.log("options (configure using environment variables or .env file):")
  for(let [key, val] of Object.entries(config)) {
    if (key.search(/SECRET|PASSWORD/) >= 0) val = "*****"
    console.log(`    ${key}: ${val}`)
  }

  await setupDatabase()

  console.log(`available command line options:`)
  console.log(` --clear-sessions, -c: clear sessions collection`)
  console.log(` --clean-migrations: clean removed migrations`)

  console.log(`command line arguments: ${JSON.stringify(process.argv.slice(2))}`)

  for (let arg of process.argv.slice(2)) {
    if (arg === '--clear-sessions' || arg === '-c') {
      console.log('clear sessions collection')
      await mongoose.connection.db.collection('sessions').deleteMany({})
      process.exit(0)
    } else if (arg === '--clean-migrations') {
      console.log('clean migrations collection')
      await migrations.migrate(mongoose.connection.db, {clean: true})
      process.exit(0)
    } else {
      console.log(`invalid argument: ${arg}`)
      process.exit(1)
    }
  }
  
  await create_admin_user()
  await create_secret_token()
  
  const app = createApp()

  if (!await migrations.migrate(mongoose.connection.db, {apply: true})) {
    console.log(`server aborting`)
    process.exit(123)
  }

  app.listen(parseInt(config.PORT), () => {
    console.log(`server started listening on port: ${config.PORT}`)
    console.log(`should be accessible from url: ${config.SERVER_URL}`)
  })
}

if (process.env.NODE_ENV !== 'test') {
  serve() // start server
}

// export functionality for testing suite
module.exports = {
  createApp,
  setupDatabase,
  createOrUpdateUser,
  create_admin_user,
}
 