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

        // considera la migrazione non applicata
        // cosi' la ripete ad libitum
        return false 
    }
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
            return
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