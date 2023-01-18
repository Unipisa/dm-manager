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

    D20221124_adjust_visit_model_3: async (db) => {
        const visits = db.collection('visits')
        const people = db.collection('people')
        let res = true
        for (const visit of await visits.find({}).toArray()) {
            const {_id, referencePerson, invitedBy} = visit
            console.log(`visit ${_id}`)
            let referenti = (invitedBy || '')
                .split(',')
                .map(name => name.trim())
                .filter(name => name!=='')
            let referencePeople = []
            if (referencePerson) referencePeople.push(referencePerson)
            for (let name of referenti) {
                let p = await findPerson(people, name)
                if (p) {
                    referencePeople.push(p)
                } else {
                    res = false
                }
            }
            await visits.updateOne({_id}, {
                $set: { referencePeople },
                $unset: { referencePerson, invitedBy }
            })
        }
        return res
    },

    D20221126_add_size_to_labels: async db => {
        const labels = db.collection('roomlabels')
        for(const label of await labels.find({}).toArray()) {
            const {_id} = label
            console.log(`label ${_id}`)
            await labels.updateOne({_id}, {$set: {size: 0}})
        }
        return true
    },

    D20221129_fix_referencePeople_3: async db => {
        const visits = db.collection('visits')
        for (const visit of await visits.find({}).toArray()) {
            const {_id, referencePeople} = visit
            console.log(`visit ${_id}`)
            let modified = false
            const people = referencePeople.map(person => {
                if (person?._id) {
                    modified = true
                    return person?._id
                }
                return person
            })
            console.log(`people: ${JSON.stringify(people)}`)
            if (modified) {
                console.log(`...fix ${_id}`)
                await visits.updateOne({_id}, {
                    $set: { referencePeople: people },
                })
            }
        }
        return true
    },

    D20221129_add_publish: async db => {
        const visits = db.collection('visits')
        visits.updateMany({}, {$set: {publish: true}})
        return true
    },

    D20221204_rename_role_2: async db => {
        const users = db.collection('users')
        users.updateMany({roles: 'room-manager'},{$set:{"roles.$": 'label-manager' }})
        users.updateMany({roles: 'room-supervisor'},{$set:{"roles.$": 'label-supervisor' }})
        const tokens = db.collection('tokens')
        tokens.updateMany({roles: 'room-manager'},{$set:{"roles.$": 'label-manager' }})
        tokens.updateMany({roles: 'room-supervisor'},{$set:{"roles.$": 'label-supervisor' }})
        return true
    },

    D20221228_grants_multiple_ssds: async db => {
        const grants = db.collection('grants')
        grants.find().forEach(async (grant) => {
            var newSSD = []
            if (! Array.isArray(grant.SSD)) {
            if (grant.SSD)
                newSSD = [ grant.SSD ]
            else 
                newSSD = []
            }
            await grants.updateOne({ _id: grant._id }, { $set: { 'SSD': newSSD }})
        })

        return true;
    },

    D20230111_grants_isodates: async db => {
        const grants = db.collection('grants')

        for (let grant of await grants.find().toArray()) {
            if (grant.startDate)
                await grants.updateOne({ _id: grant._id }, { $set: { 'startDate': new Date(grant.startDate) }})
            if (grant.endDate)
                await grants.updateOne({ _id: grant._id }, { $set: { 'endDate': new Date(grant.endDate) }})
        }

        return true;
    },

    D20230111_import_room_assignments_7: async db => {
        const rooms = await db.collection('rooms').find().toArray()
        const visits = db.collection('visits')
        const assignments = db.collection('roomassignments')

        console.log(`rimuovo tutte le assegnazioni prima di re-importarle`)
        assignments.deleteMany({})

        for (let visit of await visits.find().toArray()) {
            if (visit.building == "" && visit.roomNumber == "") continue
            if (visit.building == "Ex Albergo") visit.building = 'Ex-Albergo'
            const found = rooms.filter(room => {
                return (room.building == visit.building
                    && `Piano ${room.floor}, ${room.number}` == visit.roomNumber)
                })
            if (found.length === 0) {
                console.log(`*** cannot find room for visit ${JSON.stringify(visit)}`)
                continue
            }
            if (found.length > 1) {
                console.log(`*** multiple rooms: ${found}`)
                continue
            }
            await assignments.insertOne({
                person: visit.person,
                startDate: visit.startDate,
                endDate: visit.endDate,
                room: found[0]._id,
                notes: `visit: ${visit._id}`
            })
        }
        return true
    },

    D20230117_add_nSeats_to_rooms: async db => {
        const rooms = db.collection('rooms')
        rooms.updateMany({}, {$set: {nSeats: 0}})
        return true
    },

    D20230118_fix_grants_nazionale: async db => {
        const grants = db.collection('grants')
        grants.updateMany({ funds: 'Nazionale' }, { $set: {funds: 'National'}})
        grants.updateMany({ funds: 'Internazionale' }, { $set: {funds: 'International'}})
        return true
    }
}

async function migrate(db) {
    let config = await db.collection('config').findOne({})
    if (config === null) {
        console.log(`no config document in database. Create empty config.`)
        config = { migrations: [] }
        await db.collection('config').insertOne(config)
    }
    console.log("Migrations:")

    for (const [name, run] of Object.entries(migrations)) {
        if (config.migrations.includes(name)) {
            console.log(` (*) ${name}`)
            continue
        }
        console.log(` (+) ${name}`)
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