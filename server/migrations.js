/**
 * "migrations" contiene le migrazioni da applicare.
 * Se la funzione torna true il nome viene salvato
 * nel database e la migrazione non verrà più applicata.
 * Le migrazioni devono essere autoconsistenti, non bisogna
 * utilizzare i modelli perché potrebbero non corrispondere 
 * più allo stato del database
 */

 async function findPerson(people, firstName, lastName, affiliazione) {
    let p = await people.findOne({ firstName, lastName })
    if (p === null) {
        p = await people.insertOne({ firstName, lastName, affiliation: affiliazione || "Università di Pisa"})
        p = p.insertedId
        console.log(`Nuova persona creata: ${firstName} ${lastName}`)
    } else {
        console.log(`Persona trovata: ${firstName} ${lastName}`)
    }
    return p
}

async function personFromName(people, name) {
    const aff = name.replace(')',' ').split('(').map(x => x.trim())
    name = aff[0]
    affiliazione = aff[1]
    const names = name.split(' ').map(x => x.trim()).filter(x => x!=='')
    if (names.length === 2) {
        return await findPerson(people, names[0], names[1], affiliazione)
    } else if (names.length === 3) {
        if (['del', 'dal', 'de', 'di', 'da', 'della'].includes(names[1].toLowerCase())) {
            return await findPerson(people, names[0], `${names[1]} ${names[2]}`, affiliazione)
        } else if ([
                'carlo', 'laura', 'giovanni', 'letizia', 
                'stella', 'federico', 'antonio',
                'alessandra', 'agnese', 'james',
                'gianluca', 'gipo', 'romani',
                's.', 'g.', 'a.',
            ].includes(names[1].toLowerCase())) {
            return await findPerson(people, `${names[0]} ${names[1]}`, names[2], affiliazione)
        }
    }
    console.log(`*** cannot convert name "${name}" to Person`)
    return null 
}


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
                let p = personFromName(people, referenti[0])                
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
    },

    D20221128_import_grants_11: async db => {
        const people = db.collection('people')
        const grants = db.collection('grants')
        const data = require('./migration_20221128')
        for (let record of data) {
            record.pi = record.pi ? await personFromName(people, record.pi) : null
            if (record.pi) record.pi = record.pi._id
            record.localCoordinator = record.localCoordinator ? await personFromName(people, record.localCoordinator) : null
            if (record.localCoordinator) record.localCoordinator = record.localCoordinator._id
            const members = []
            for (let name of record.members.split(',')) {
                if (name.trim() === '') continue
                const p = await personFromName(people, name)
                if (p) members.push(p._id)
            }
            record.members = members
            console.log(`inserting ${JSON.stringify(record, null, 2)}`)
            const res = await grants.insertOne(record)
            console.log(`...${JSON.stringify(res)}`)
        }
        return true
    },
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