const Token = require('../models/Token')
const Person = require('../models/Person')
const Staff = require('../models/Staff')

// Populate the request context after Passport has restored the session.
// Bearer token roles take precedence over session and staff-derived roles.
async function requestRoles(req, res, next) {
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
    for (const staff of req.staffs) {
      if (staff.isInternal) {
        // se modifchi queste qualifiche ricordati di modificare
        // anche la descrizione in fondo alle pagine dei relativi
        // processi
        if (['PO', 'PA', 'RIC', 'RTDb', 'RTDa', 'RTT',
          'Assegnista', 'Tecnologo', 'Titolare di contratto di ricerca', 'Titolare di incarico post-doc', 'Titolare di incarico di ricerca', 'Titolare di borsa di ricerca',
          'Dottorando in Matematica', 'Dottorando in HPSC',
          'Professore Emerito',
          'Collaboratore',
          'Personale in quiescenza',
          'PTA',
          ].includes(staff.qualification)) {
            add_role('/process/seminars')
            add_role('/process/conferences')
            add_role('/process/visitsList')
        }
        if (['PO', 'PA', 'RIC', 'RTDb', 'RTDa', 'RTT',
          'Assegnista', 'Tecnologo', 'Titolare di contratto di ricerca', 'Titolare di incarico post-doc', 'Titolare di incarico di ricerca', 'Titolare di borsa di ricerca',
          'Dottorando in Matematica', 'Dottorando in HPSC',
          'Professore Emerito',
          'Collaboratore',
          'Personale in quiescenza',
          ].includes(staff.qualification)) {
            add_role('/process/my/visits')
        }
        if (['PO', 'PA', 'RIC', 'RTDb', 'RTDa', 'RTT',
          'Dottorando in Matematica', 'Dottorando in HPSC',
          'PTA', 'Assegnista', 'Tecnologo', 'Titolare di contratto di ricerca', 'Titolare di incarico post-doc', 'Titolare di incarico di ricerca', 'Titolare di borsa di ricerca',
          ].includes(staff.qualification)) {
            add_role('/process/my/courses')
            add_role('/process/timesheets')
        }
      }
    }
    req.log_who = user.username || `${user._id}`

    function add_role(role) {
      if (!req.roles.includes(role)) req.roles.push(role)
    }
  }

  // se c'è un token usa i roles del token
  const PREFIX = 'Bearer '
  if (req.headers.authorization?.startsWith(PREFIX)) {
    const token = req.headers.authorization.slice(PREFIX.length)
    try {
      const tok = await Token.findOne({ token })
      req.roles = tok.roles || []
      req.log_who = tok.name || tok.token
      // console.log('Roles: ', req.roles)
    }
    catch (err) {
      res.status(401)
      res.send({error: "invalid token"})
      return
    }
  }

  next()
}

module.exports = requestRoles
