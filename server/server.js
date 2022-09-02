const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const session = require('express-session')
const passport = require('passport')
const mongoose = require('mongoose')
const LocalStrategy = require('passport-local')
const OAuth2Strategy = require('passport-oauth2')

const User = require('./models/User')
const config = require('./config')

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

if (!config.OAUTH2_CLIENT_SECRET) {
  console.log("provide OAUTH2_CLIENT_SECRET")
  process.exit(2)
}

function oauth2_verify(accessToken, refreshToken, params, profile, cb) {
  console.log(`oauth2 verify: accessToken ${accessToken} refreshToken: ${refreshToken} profile: ${profile} params: ${params}`)
  console.log(`params: ${JSON.stringify(params)}`)
  console.log(`profile: ${JSON.stringify(profile)}`)
  const username = profile[config.OAUTH2_USERNAME_FIELD]
  console.log(`username: ${username}`)

  if (!username) throw new Error("invalid username")

  User.findOrCreate({ username }, 
    function (err, user) {
      return cb(err, user)
    })
  }

let oauth2_strategy = new OAuth2Strategy({
  authorizationURL: config.OAUTH2_AUTHORIZE_URL,
  tokenURL: config.OAUTH2_TOKEN_URL,
  clientID: config.OAUTH2_CLIENT_ID,
  clientSecret: config.OAUTH2_CLIENT_SECRET,
  callbackURL: `${config.SERVER_URL}/login/oauth2/callback`
}, oauth2_verify )

oauth2_strategy.userProfile = function (accesstoken, done) {
  // abilita questo se vuoi vedere lo "scope" del token.
  if (false) return done(null, {}) 

  console.log(`accesstoken: ${accesstoken}`)
  // choose your own adventure, or use the Strategy's oauth client
  this._oauth2._request("GET", "https://iam.unipi.it/oauth2/userinfo", null, null, accesstoken, (err, data) => {
    if (err) { return done(err); }
    console.log("DATA: ${data}")
    try {
        data = JSON.parse( data );
    }
    catch(e) {
      return done(e);
    }
    done(null, data);
  });
};

passport.use(oauth2_strategy)

const app = express()

app.use(cors(
  {
    origin: config.CORS_ORIGIN,
    optionsSuccessStatus: 200
  }))

app.use(morgan('tiny')) // access log

app.use(express.static('build'))

app.use(express.json()) // parse request data into req.body

app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.authenticate('session'));

app.get('/config', (req, res) => {
  res.send({
    VERSION: config.VERSION,
    OAUTH2_AUTHORIZE_URL: config.AUTHORIZE_URL,
    OAUTH2_CLIENT_ID: config.CLIENT_ID,
    SERVER_URL: config.SERVER_URL,
  })
})

app.post('/login/password',
  passport.authenticate('local'),
  function(req, res) {
    const user = req.user.toObject()
    console.log(`login ${JSON.stringify(user)}`)
    res.send({ user })
  })

app.get('/login/oauth2',
  passport.authenticate('oauth2'))

app.get('/login/oauth2/callback',
  passport.authenticate('oauth2'),
  function(req, res) {
    const user = req.user.toObject()
    console.log(`login ${JSON.stringify(user)}`)
    res.redirect(`/oauth2`)
  }
)

app.post('/logout', function(req, res){
  req.logout(function(err) {
    if (err) { return next(err) }
    // res.redict('/login')
    res.send({ "user": null })
  });
});

app.get('/hello', (req, res) => {
  res.send('Hello World!')
})

app.post('/token', (req, res) => {
})

//The 404 Route (ALWAYS Keep this as the last route)
app.all('*', function(req, res){
  res.status(404).send({error: "not found"});
});

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
      admin = await User.create({ username })
      console.log(`Create user "${admin.username}"`)
    }
    if (password) {
        await admin.setPassword(password)
        await admin.save()
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

async function start() {
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

start()
