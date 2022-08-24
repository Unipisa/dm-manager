const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const passport = require('passport')
const LocalStrategy = require('passport-local')

const User = require('./models/user').User
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

app.post('/login/password',
  passport.authenticate('local'),
  function(req, res) {
    console.log(`login ${JSON.stringify(req.user)}`)
    res.send(`Hello ${JSON.stringify(req.user)}`)
  })

app.get('/hello', (req, res) => {
  res.send('Hello World!')
})

app.post('/token', (req, res) => {
})

app.listen(config.PORT, () => {
  console.log(`server started: http://localhost:${config.PORT}`)
})
