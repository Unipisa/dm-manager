/**
 * "migrations" contiene le migrazioni da applicare.
 * Se la funzione torna true il nome viene salvato
 * nel database e la migrazione non verrà più applicata.
 * Le migrazioni devono essere autoconsistenti, non bisogna
 * utilizzare i modelli perché potrebbero non corrispondere 
 * più allo stato del database
 */

const migrations = { 
    migration_test: async (db) => {
        return true
    },

    populate_people_from_visits: async (db) => {
        const visits = db.collection('visits')
        const people = db.collection('people')
        for (const visit of await visits.find({}).toArray()) {
            const _id = visit._id
            console.log(`visit: ${JSON.stringify(visit)}`)
            console.log(`visit ${_id}`)
            if (visit.person) {
                console.log(`...visit already has person`)
                continue
            }
            let person = await people.findOne({
                lastName: visit.lastName,
                firstName: visit.firstName,
            })
            if (person) {
                console.log(`...person found`)
            } else {
                console.log(`...new person`)
                person = await people.insertOne({
                    firstName: visit.firstName,
                    lastName: visit.lastName,
                    affiliation: visit.affiliation,
                    email: visit.email,
                })
                person = person.insertedId
            }
            await visits.updateOne(
                { _id }, { $set: { person }})
    }
        return true // migrazione OK
    },

    adjust_visit_dates_to_UTC: async (db) => {
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

        const visits = db.collection('visits')
    
        for (const visit of await visits.find({}).toArray()) {
            console.log(`visit ${visit._id}`)
            const startDate = adjusted(visit.startDate)
            const endDate = adjusted(visit.endDate)

            await visits.update({ _id: visit._id},
                { $set: { startDate, endDate }})
        }
        
        return true // migration OK!
    },

    D20221123_remove_names_from_visit: async(db) => {
        const visits = db.collection('visits')
        for (const visit of await visits.find({}).toArray()) {
            const _id = visit._id
            console.log(`visit ${_id}`)
            await visits.update({_id}, {$unset: {
                firstName: 1,
                lastName: 1,
                email: 1,
            }})
        }
        return true
    },

    D20221123_adjust_visit_model: async (db) => {
        const visits = db.collection('visits')
        const people = db.collection('people')
        let res = true
        for (const visit of await visits.find({}).toArray()) {
            const {_id, invitedBy} = visit
            console.log(`visit ${_id}`)
            let referenti = invitedBy
                .split(',')
                .map(name => name.trim())
                .filter(name => name!=='')

            console.log(`referenti: ${JSON.stringify(referenti)}`)
            if (referenti.length>0) {
                const names = referenti[0].split(' ')
                let p = null

                async function findPerson(firstName, lastName) {
                    let p = await people.findOne({ firstName, lastName })
                    if (p === null) {
                        p = await people.insertOne({ firstName, lastName, affiliation: "Università di Pisa"})
                        p = p.insertedId
                        console.log(`Nuova persona creata: ${firstName} ${lastName}`)
                    } else {
                        console.log(`Persona trovata: ${firstName} ${lastName}`)
                    }
                    return p
                }

                if (names.length === 2) {
                    p = await findPerson(names[0], names[1])
                } else if (names.length === 3) {
                    if (['del', 'de', 'di', 'della'].includes(names[1].toLowerCase())) {
                        p = await findPerson(names[0], `${names[1]} ${names[2]}`)
                    } else if (['carlo'].includes(names[1].toLowerCase())) {
                        p = await findPerson(`${names[0]} ${names[1]}`, names[2])
                    }
                }
                
                if (p) {
                    await visits.updateOne({_id}, 
                        { $set: {
                            referencePerson: p,
                            invitedBy: referenti.slice(1).join(', ')
                        }})
                } else {
                    console.log(`Non sono riuscito ad associare una persona a ${referenti[0]}`)
                    res = false
                }
            }
        }
        return res
    }
}

async function migrate(db) {
    let config = await db.collection('config').findOne({})
    if (config === null) {
        console.log(`no config document in database. Create empty config.`)
        config = { migrations: [] }
        await db.collection('config').insertOne(config)
    }
    console.log(`config: ${JSON.stringify(config)}`)
    // console.log(`applied migrations: ${ config.migrations.join(', ') || "none"}`)
    console.log("applying migrations:")

    for (const [name, run] of Object.entries(migrations)) {
        if (config.migrations.includes(name)) {
            console.log(`= ${name}`)
            continue
        }
        console.log(`+ ${name}`)
        if (await run(db)) {
            // migrazione applicata!
            config.migrations.push(name)
            await db.collection('config').updateOne(
                { _id: config._id }, 
                { $set: {migrations: config.migrations }})
            console.log(`migration ${name} OK!`)
        } else {
            console.log(`migration ${name} FAILED! ****`)
            return false
        }
    }
    console.log("all migrations applied")
    return true
}

module.exports.migrate = migrate