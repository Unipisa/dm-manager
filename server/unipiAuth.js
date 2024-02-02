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
    
      if (! username) throw new Error("invalid username")
    
      Person.aggregate([{
        $match: { 
          $or: [
            { email: username },
            { alternativeEmails: username },
          ]
      }}]).exec(function(err, people) {
        if (err) return cb(err)
        if (people.length > 1) {
          notify('admin', 'oauth', `duplicate email ${username} detected in Person collection`)
        }
        if (people.length >= 1) {
          const person = people[0]
          console.log(`person: ${JSON.stringify(person)}`)
          User.findOneAndUpdate({ username: username }, {
            $set: {
              username: username, 
              firstName: person.firstName,
              lastName: person.lastName,
              email: person.email,
              person: person._id,
            }
          }, {
            upsert: true,
            returnOriginal: false,
            new: true
          }, function (err, user) {
            if (user.__v === 0) {
              // user was just created
              notify('admin', 'oauth', `user ${username} has been created, person ${user.person} [${person?.firstName} ${person?.lastName}] linked`)
            }
            user.oauth2 = {accessToken, refreshToken}
            return cb(err, user)
          })
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
  
    