const Visit = require('./models/Visit')
const Person = require('./models/Person')
const Config = require('./models/Config')

/**
 * "migrations" contiene le migrazioni da applicare.
 * Se la funzione torna true il nome viene salvato
 * nel database e la migrazione non verrà più applicata.
 */

const migrations = { 
    migration_test: async () => {
        return true
    },

    populate_people_from_visits: async () => {
        for (const visit of await Visit.find({})) {
            console.log(`visit ${visit.firstName} ${visit.lastName}`)
            if (visit.person) {
                console.log(`...visit already has person`)
                continue
            }
            const person = await Person.findOne({
                lastName: visit.lastName,
                firstName: visit.firstName,
            })
            if (person) {
                console.log(`...person found`)
                visit.person = person
                await visit.save()
            } else {
                console.log(`...new person`)
                visit.person = await Person.create({
                    firstName: visit.firstName,
                    lastName: visit.lastName,
                    affiliation: visit.affiliation,
                })
                await visit.save()
            }
        }

        return true // migrazione OK
    },

    adjust_visit_dates_to_UTC: async () => {
        function adjusted(date) {
            if (date === null) return date
            const iso = date.toISOString()
            // something like: "2022-09-30T22:00:00.000Z"
            const hours = date.getUTCHours()
            if (hours < 12) {
                date.setUTCHours(0)
            } else {
                date.setUTCHours(24)
            }
            console.log(`${iso} --> ${date.toISOString()}`)
            return date
        }

        for (const visit of await Visit.find({})) {
            console.log(`visit ${visit.firstName} ${visit.lastName}`)
            visit.startDate = adjusted(visit.startDate)
            visit.endDate = adjusted(visit.endDate)
            await visit.save()
        }
        
        return true // migration OK!
    },
}

async function migrate() {
    const config = (await Config.findOne({})) || (await Config.create({
        migrations: [],
    }))
    console.log(`config: ${config}`)
    console.log(`applied migrations: ${ config.migrations.join(', ') || "none"}`)
    console.log("applying migrations...")
    for (const [name, run] of Object.entries(migrations)) {
        if (config.migrations.includes(name)) {
            console.log(`= ${name}`)
            continue
        }
        console.log(`+ ${name}`)
        if (await run()) {
            // migrazione applicata!
            config.migrations.push(name)
            await config.save()
            console.log(`... migrazione OK`)
        } else {
            console.log(`... migrazione KO`)
        }
    }
    console.log("...migrations applied")
}

module.exports.migrate = migrate