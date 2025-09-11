const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const session = require('express-session')
const passport = require('passport')
const mongoose = require('mongoose')
const LocalStrategy = require('passport-local')
const fs = require('fs')

const User = require('./models/User')
const Token = require('./models/Token')
const Person = require('./models/Person')
const Staff = require('./models/Staff')
const { notify } = require('./models/Notification')
const config = require('./config')
const UnipiAuthStrategy = require('./unipiAuth')
const api = require('./api')
const migrations = require('./migrations')
const MongoStore = require('connect-mongo')
const crypto = require('crypto')
const {setupDatabase, create_admin_user, create_secret_token} = require('./database')
const { UNSAFE_RouteContext } = require('react-router')

function setup_passport() {
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
    req.person = null
    req.roles = []
    req.staffs = []

    // get person
    if (user?.person) {
      req.person = await Person.findById(user.person)
    }

    // get staffs
    if (user?.person) {
      req.staffs = await Staff.aggregate([
        { $match: { person: user.person }},
        { $match: {
            $expr: { 
              $and: [
                { $or: [ {$eq: ['$startDate', null]}, {$lte: ['$startDate', '$$NOW']}]},
                { $or: [ {$eq: ['$endDate', null]}, {$gte: ['$endDate', '$$NOW']}]},
              ]
            }
          }
        },
      ])
    }

    // get roles
    if (user) {
      req.roles = [...user.roles]
      for (staff of req.staffs) {
        if (staff.isInternal) {
          // se modifchi queste qualifiche ricordati di modificare 
          // anche la descrizione in fondo alle pagine dei relativi
          // processi
          if (['PO', 'PA', 'RIC', 'RTDb', 'RTDa', 'RTT',
            'Assegnista', 'Dottorando in Matematica', 'Dottorando in HPSC',
            'Professore Emerito',
            'Collaboratore',
            'Personale in quiescenza',
            'PTA', 
            ].includes(staff.qualification)) {
              add_role('/process/seminars')
              add_role('/process/conferences')
              add_role('/process/visitsList')
              add_role('/process/my/urls')
          }
          if (['PO', 'PA', 'RIC', 'RTDb', 'RTDa', 'RTT',
            'Assegnista', 'Dottorando in Matematica', 'Dottorando in HPSC',
            'Professore Emerito',
            'Collaboratore',
            'Personale in quiescenza',
            ].includes(staff.qualification)) {
              add_role('/process/my/visits')
              add_role('/process/my/courses')
          }
        }
      }
      req.log_who = user.username || `${user._id}`

      function add_role(role) {
        if (!req.roles.includes(role)) req.roles.push(role)
      }

      // console.log(`sending user ${JSON.stringify({...user}, null, 2)}`)
    }

    // se c'è un token usa i roles del token
    const PREFIX = 'Bearer '
    if (req.headers.authorization?.startsWith(PREFIX)) {
      const token = req.headers.authorization.slice(PREFIX.length)
      try {
        tok = await Token.findOne({ token })
        req.roles = tok.roles || []
        req.log_who = tok.name || tok.token
        console.log('Roles: ', req.roles)
      }
      catch (err) {
        res.status(401)
        res.send({error: "invalid token"})
        return
      }
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
    res.send({ 
      user: req.user || null, 
      person: req.person,
      roles: req.roles, 
      staffs: req.staffs 
    })
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

function catch_errors(err,origin) {
  console.error(`**** uncaughtException`)
  console.error(`origin: ${origin}`)
  console.log(err)
  console.log(err.stack)
  notify("notify/admin", "uncaughtException", `
uncaughtException: ${err}

origin: ${origin}

${err.stack}
  `)
}

function createApp() {
  setup_passport()
  const app = express()
  setup_routes(app)
  return app
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

  console.log(`
execute: npm run command
to see available command line options
e.g. to clear sessions collection or clean migrations
  `)

  await setupDatabase()
  await create_admin_user()
  await create_secret_token()

  process.on('uncaughtException', catch_errors)
  
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

module.exports = {
  createApp,
  serve
}
 