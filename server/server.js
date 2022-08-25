const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const passport = require('passport')
const mongoose = require('mongoose')
const LocalStrategy = require('passport-local')

const User = require('./models/User')
const config = require('./config')

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const app = express()
app.use(cors(
  {
    origin: config.CORS_ORIGIN,
    optionsSuccessStatus: 200
  }))

app.use(morgan('tiny')) // access log
app.use(express.static('build'))
app.use(express.json()) // parse request data into req.body

app.get('/config', (req, res) => {
  res.send({
    VERSION: config.VERSION,
    AUTHORIZE_URL: config.AUTHORIZE_URL,
    CLIENT_ID: config.CLIENT_ID,
    EXCHANGE_CODE_FOR_TOKEN_SERVER_URL: config.EXCHANGE_CODE_FOR_TOKEN_SERVER_URL,
  })
})

app.post('/login/password',
  passport.authenticate('local'),
  function(req, res) {
    console.log(`login ${JSON.stringify(req.body)}`)
    res.status(500).send({error: "not yet implemented"})
  })

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
      admin = User.create({ username })
      console.log(`create User "${admin.username}"`)
    }
    if (password) {
        await admin.setPassword(password)
        await admin.save()
        console.log(`obj: ${JSON.stringify(admin)}`)
        console.log(`Set password "${password}" for user "${admin.username}"`)
    } else {
      console.log(`Password not provided (set ADMIN_PASSWORD)`)
    }
  }
  if (User.countDocuments({}) === 0) {
    console.log(`No users in database. Create one by setting ADMIN_USER and ADMIN_PASSWORD`)
  }
}

async function start() {
  console.log("options (configure using environment variables or .env file):")
  for(const [key, val] of Object.entries(config)) {
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
