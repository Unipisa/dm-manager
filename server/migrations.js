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

    D20230111_import_room_assignments_8: async db => {
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
    },

    D20230119_rename_Ex_Albergo_1: async db => {
        const rooms = db.collection('rooms')
        rooms.updateMany({building: 'Ex-Albergo'}, {$set: {building: 'X'}})
        const visits = db.collection('visits')
        visits.updateMany({building: 'Ex-Albergo'}, {$set: {building: 'X'}})
        return true
    },

    D20230122_import_people_from_wordpress_20: async db => {
        const staffs = db.collection('staffs')
        const people = db.collection('people')
        const rooms = db.collection('rooms')
        const roomassignments = db.collection('roomassignments')
        const axios = require('axios')
        let data = []
        let page = []
        let count = 1
        const per_page = 99
        let failed = []
        function failure(record, msg) {
            console.log(`############# FAIL: ${msg}`)
            failed.push(`${record.slug}: ${msg}`)
        }
        do {
            const URL=`https://www.dm.unipi.it/wp-json/wp/v2/people?per_page=${per_page}&page=${count}`
            console.log(`fetch: ${URL}`)
            const response = await axios.get(URL)
            count++
            page = response.data
            console.log(`page.length: ${page.length}`)
            //console.log(`response: ${JSON.stringify(response)}`)
            //page = await response.json()
            data.push(...page)
        } while(page.length >= per_page)
        console.log(`data length: ${data.length}`)
        console.log(`cancello collection staff`)
        staffs.deleteMany({})
        for (let record of data) {
            console.log(`**************** ${record.acf.nome} ${record.acf.cognome}`)
            console.log(`${record.link}`)
            const person = await findPerson(people, record.acf.nome, record.acf.cognome, 'Università di Pisa')
            console.log(`person: ${JSON.stringify(person)}`)
            ;[   
                ['gender','Genere'], 
                ['email', 'email'], 
                ['phone', 'telefono'], 
                ['personalPage', 'pagina_personale'], 
                ['orcid','orcid'],
                ['arxiv_orcid', 'arxiv_orcid'],
                ['google_scholar', 'google_scholar'],
                ['mathscinet', 'mathscinet'],
            ].forEach(([field, wpfield]) => {
                if (!person[field]) {
                    if (record.acf[wpfield]) {
                        console.log(`assegna ${field}: ${record.acf[wpfield]}`)
                        people.findOneAndUpdate({_id: person._id}, {$set: {[field]: record.acf[wpfield]}})
                    }
                } else if (person[field] !== record.acf[wpfield]) {
                    failure(record, `${field} non corrisponde ${person[field]}!=${record.acf[wpfield]}`)
                }
            })
            if (['', 'Studente', 'Docente Esterno', 'non in servizio'].includes(record.acf.qualifica)) {
                console.log(`salta qualifica: ${record.acf.qualifica}`)
                continue
            }
            if (![
                'PO', 'PA', 'RIC', 'RTDb', 'RTDa', 
                'Assegnista', 'Dottorando', 'PTA', 
                'Collaboratore e Docente Esterno',
                'Professore Emerito',
            ].includes(record.acf.qualifica)) {
                failure(record, `invalid qualification: ${record.acf.qualifica}`)
                continue
            }
            let staff = {
                "person": person._id,
                startDate: null,
                endDate: null,
                wordpressId: record.id,
                matricola: record.acf.username,
                qualification: record.acf.qualifica,
                SSD: record.acf.ssd,
                cn_ldap: record.acf.cn_ldap,
                notes: `wordpressLink: ${record.link}`
            }
            if (record.acf.ciclo_dottorato) {
                if (record.acf.qualifica !== 'Dottorando') {
                    // inserisce due record
                    await staffs.insertOne({...staff})
                }
                staff.qualification = 'Dottorando'
                staff.startDate = new Date(`${parseInt(record.acf.ciclo_dottorato) + 1985}-11-01T00:00:00.000Z`)
                staff.endDate = new Date(`${parseInt(record.acf.ciclo_dottorato) + 1989}-11-01T00:00:00.000Z`)
            }
            await staffs.insertOne(staff)
            if (record.acf.stanza) {
                if (record.acf.edificio === 'Ex Albergo') record.acf.edificio='X'
                room = await rooms.findOne({
                    building: record.acf.edificio,
                    floor: record.acf.piano,
                    number: record.acf.stanza
                })
                if (!room) {
                    failure(record, `non trovo la stanza ${record.acf.edificio}${record.acf.piano}-${record.acf.stanza}`)
                    continue
                }
                console.log(`room found ${room._id}`)
                let assignment = await roomassignments.findOne({"person": person._id, "room": room._id })
                console.log(`assignment: ${JSON.stringify(assignment)}`)
                assignment = await roomassignments.findOneAndUpdate(
                    { "person": person._id, "room": room._id }, // condition
                    { $set: {}}, // update
                    { upsert: true } // options
                )
            }
        }
        if (failed.length) {
            console.log(`==> migration failures:`)
            failed.forEach(msg => console.log(`- ${msg}`))
        }
        return true
    },

    D20230123_fill_assignments_dates_1: async function(db) {
        const assignments = db.collection('roomassignments')
        assignments.updateMany({"startDate": { $exists: false }},
            { $set: { startDate: null } })
        assignments.updateMany({"endDate": { $exists: false }},
            { $set: { endDate: null } })
        return true
    }, 

    D20230127_import_groups_from_wordpress_2: async function(db) {
        const people = db.collection('people')
        const groups = db.collection('groups')
        const axios = require('axios')
        let URL=`https://www.dm.unipi.it/wp-json/wp/v2/typology`
        console.log(`fetch: ${URL}`)
        const response = await axios.get(URL)
        const names = {}

        console.log(`clear collection groups`)
        await groups.deleteMany({})

        for (const record of response.data) {
            console.log(JSON.stringify(record.name)) 
            URL = `https://www.dm.unipi.it/wp-json/wp/v2/people?typology=${record.id}`
            console.log(`fetch: ${URL}` )
            const res = await axios.get(URL)
            console.log(res.data)
            let members = []
            for (const person of res.data) {
                const p = await findPerson(people, person.acf.nome, person.acf.cognome, 'Università di Pisa')
                members.push(p._id)
            }
            await groups.insertOne({
                name: record.name,
                members
            })
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