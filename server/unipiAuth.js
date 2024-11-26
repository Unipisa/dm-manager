const OAuth2Strategy = require('passport-oauth2')

const User = require('./models/User')
const Person = require('./models/Person')
const { notify} = require('./models/Notification')
const config = require('./config')
  
class UnipiAuthStrategy extends OAuth2Strategy {
  constructor(options) {
    super({...options, scope: "openid"}, (accessToken, refreshToken, params, profile, cb) => {
      console.log(`oauth2 verify: accessToken ${accessToken} refreshToken: ${refreshToken} profile: ${profile} params: ${params}`)
      console.log(`params: ${JSON.stringify(params)}`)
      console.log(`profile: ${JSON.stringify(profile)}`)
      const username = profile[options.usernameField]
      console.log(`username: ${username}`)
    
      if (! username) return cb("invalid username")

      return User.findOne({ username: username }, async function (err, user) {
        if (err) return cb(err)
        const people = await Person.aggregate([{
          $match: { 
            $or: [
              { email: username },
              { alternativeEmails: username },
            ]
          }
        }])
        if (people.length>1) {
          notify('admin', 'oauth', `duplicate email ${username} detected in Person collection`)
        }
        if (user) {
          if (!user.person) {
            if (people.length === 1) {
              user.person = people[0]._id
              await user.save()
            } else if (people.length === 0) {
              notify('admin', 'oauth', `user ${username} has no person associated`)
              return cb(err, null)
            } else {
              return cb(err, null)
            }
          }
          return cb(err, user)
        } else { // no user found
          if (people.length === 1) {
            const person = people[0]
            const user = new User({
              username: username,
              firstName: person.firstName,
              lastName: person.lastName,
              email: person.email,
              person: person._id,
            })
            await user.save()
            return cb(err, user)
          } else {
            return cb(err, null)
          }
        }
      })
    })
  }
  
  userProfile(accesstoken, done) {
    // abilita questo se vuoi vedere lo "scope" del token.
    if (false) return done(null, {}) 
  
    console.log(`accesstoken: ${accesstoken}`)
    // choose your own adventure, or use the Strategy's oauth client
    this._oauth2._request("GET", config.OAUTH2_USERINFO_URL, null, null, accesstoken, (err, data) => {
      if (err) { return done(err) }
      console.log(`DATA: ${data}`)
      try {
          data = JSON.parse( data )
      }
      catch(e) {
        return done(e)
      }
      done(null, data)
    })
  }
}

module.exports = UnipiAuthStrategy
  
    