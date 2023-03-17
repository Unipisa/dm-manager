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

async function findPerson2(people, fullName, affiliazione) {
    const names = fullName.split(' ').filter(n => n !== '')
    let p = null
    if (names.length === 2) {
        return await findPerson(people, names[0], names[1], affiliazione)
    } else {
        // find people where firstName + lastName equals fullName        
        p = await people.aggregate([
            {   $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    fullName: { $concat: ['$firstName', ' ', '$lastName'] }
                },                    
            },
            { $match: { fullName } },
        ]).toArray()
        if (p.length === 1) {
            console.log(`found ${fullName} as ${p[0].firstName}+${p[0].lastName}`)
            return p[0]
        } else {
            console.log(`*** not found ${fullName}: cannot distinguish firstName by lastName`)
            p = null
        }
    }
    return p
}

const migrations = { 
    D20221112_migration_test: async (db) => {
        return true
    },

    D20221123_adjust_visit_dates_to_UTC: async (db) => {
        // renamed, we have already applied this!
        return true

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

    D20230122_import_people_from_wordpress_22: async db => {
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
                let ciclo_dottorato = record.acf.ciclo_dottorato
                if (ciclo_dottorato === 'XXXIII') ciclo_dottorato = '33'
                staff.startDate = new Date(`${parseInt(record.acf.ciclo_dottorato) + 1985}-11-01T00:00:00.000Z`)
                staff.endDate = new Date(`${parseInt(record.acf.ciclo_dottorato) + 1989}-11-01T00:00:00.000Z`)
                // check if startDate is invalid
                if (staff.startDate.toString() === 'Invalid Date') {
                    failure(record, `invalid ciclo_dottorato: ${record.acf.ciclo_dottorato}`)
                }
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

    D20230127_import_groups_from_wordpress_8: async function(db) {
        const people = db.collection('people')
        const groups = db.collection('groups')
        const axios = require('axios')
        let page = 0
        console.log(`clear collection groups`)
        await groups.deleteMany({})

        while (true) {
            page++
            let URL=`https://www.dm.unipi.it/wp-json/wp/v2/typology?per_page=100&page=${page}`
            console.log(`fetch: ${URL}`)
            const response = await axios.get(URL)
            console.log(`found ${response.data.length} groups`)

            for (const record of response.data) {
                console.log(JSON.stringify(record.name)) 
                URL = `https://www.dm.unipi.it/wp-json/wp/v2/people?typology=${record.id}&per_page=100`
                console.log(`fetch: ${URL}` )
                const res = await axios.get(URL)
                console.log(`found ${res.data.length} members`)
                let members = []
                if (res.data.length === 100) {
                    console.log(`too many members for group ${record.name}!`)
                    return false    
                }
                for (const person of res.data) {
                    const p = await findPerson(people, person.acf.nome, person.acf.cognome, 'Università di Pisa')
                    members.push(p._id)
                }
                await groups.insertOne({
                    name: record.name,
                    members
                })
            }
            if (response.data.length < 100) break
        }
        return true
    },        

    D20230129_set_code_for_rooms_4: async function(db) {
        const rooms = db.collection('rooms')
        await rooms.updateMany({}, [{ $set: { code: { $concat: [ "$building", "$floor", ":", "$number" ] } } }])
        return true
    },

    D20230129_set_group_dates_null_1: async function(db) {
        const groups = db.collection('groups')
        // set startDate and endDate to null
        // if they are not defined
        await groups.updateMany({"startDate": { $exists: false }},
            { $set: { startDate: null } })
        await groups.updateMany({"endDate": { $exists: false }},
            { $set: { endDate: null } })
        return true
    },

    D20230201_import_photo_links_from_wp_2: async function(db) {
        const staffs = db.collection('staffs')
        const people = db.collection('people')
        const axios = require('axios')
        let page = []
        let count = 1
        const per_page = 99
        let failed = []
        function failure(record, msg) {
            console.log(`############# FAIL: ${msg}`)
            failed.push(`${record.slug}: ${msg}`)
        }
        do {
            const URL=`https://www.dm.unipi.it/wp-json/wp/v2/people?_embed=&per_page=${per_page}&page=${count}`
            console.log(`fetch: ${URL}`)
            const response = await axios.get(URL)
            count++
            page = response.data
            console.log(`page.length: ${page.length}`)
            for (let record of page) {
                const acf = record.acf
                try {
                    const person = await findPerson(people, acf.nome, acf.cognome, 'Università di Pisa')
                    const links = record._links
                    const feature = links['wp:featuredmedia']
                    if (feature) {
                        const href = feature[0].href
                        console.log(`fetch: ${href}`)
                        const response = await axios.get(href)
                        const media = response.data
                        const photoUrl = `https://www.dm.unipi.it/wp-content/uploads/${media.media_details.file}`
                        console.log(`photoUrl: ${photoUrl} for ${person.lastName}`)
                        await people.updateOne({ _id: person._id }, { $set: { photoUrl } })
                        await staffs.updateMany({ person: person._id }, { $set: { photoUrl } })
                    }
                } catch (e) {
                    failure(record, e.message)
                }
            }
        } while(page.length >= per_page)
        if (failed.length) {
            console.log(`==> migration failures:`)
            failed.forEach(msg => console.log(`- ${msg}`))
        }
        return true
    },

    D20230201_set_internal_flag_in_staffs_4: async function(db) {
        const people = db.collection('people')
        const staffs = db.collection('staffs')

        staffs.updateMany({}, {$set: 
            { isInternal: false}})

        people.find({affiliation: "Università di Pisa"}).forEach(person => {
            staffs.updateMany({ person: person._id }, { $set: { isInternal: true } })
        })

        return true
    },

    D20230202_clean_photo_urls_8: async function(db) {
        const staffs = db.collection('staffs')
        const people = db.collection('people')
        staffs.updateMany(
            { photoUrl: "https://www.dm.unipi.it/wp-content/uploads/2022/07/No-Image-Placeholder.svg_.png"}, 
            { $set: { photoUrl: "" }})
        // clear photoUrl if it is not a string
        staffs.updateMany(
            { photoUrl: {$not: {$type: 7 }}},
            { $set: { photoUrl: "" } })
        people.updateMany(
            { photoUrl: {$not: {$type: 7 }}},
            { $set: { photoUrl: "" } })
        people.updateMany(
        { photoUrl: "https://www.dm.unipi.it/wp-content/uploads/2022/07/No-Image-Placeholder.svg_.png"}, 
        { $set: { photoUrl: "" } })
        return true
    },
    
    D20230203_set_empty_fields_in_grants_5: async function(db) {
        const grants = db.collection('grants')
        await grants.updateMany(
            { createdAt: { $exists: false }},
            { $set: { createdAt: null } })
        await grants.updateMany(
            { createdBy: { $exists: false }},
            { $set: { createdBy: null }}
        )
        await grants.updateMany(
            { description: { $exists: false }},
            { $set: { description: "" }}
        )
        await grants.updateMany(
            { notes: { $exists: false }},
            { $set: { notes: "" }}
        )
        return true
    },

    D20230204_set_empty_fields_in_groups_1: async function(db) {
        const groups = db.collection('groups')
        await groups.updateMany(
            { createdAt: { $exists: false }},
            { $set: { createdAt: null } })
        await groups.updateMany(
            { createdBy: { $exists: false }},
            { $set: { createdBy: null }})
        await groups.updateMany(
            { updatedAt: { $exists: false }},
            { $set: { updatedAt: null }})
        await groups.updateMany(
            { updatedBy: { $exists: false }},
            { $set: { updatedBy: null }})
        return true
    },

    D20230204_set_empty_fields_in_people_2: async function(db) {
        const people = db.collection('people')
        for (let field of ['country', 'notes', 'photoUrl']) {
            await people.updateMany(
                { [field]: { $exists: false }},
                { $set: { [field]: "" }})
        }
        for (let field of ['createdAt', 'createdBy', 'updatedAt', 'updatedBy']) {
            await people.updateMany(
                { [field]: { $exists: false }},
                { $set: { [field]: null }})
        }
        return true
    },

    D20230215_import_thesis_10: async function(db) {
        const people = db.collection('people')
        const theses = db.collection('theses')
        const path = require('path')

        // clear collection!!!!
        await theses.deleteMany({})

        const axios = require('axios')
        const cheerio = require('cheerio')
        // read data from file "phd.txt"
        const fs = require('fs')
        const data = fs.readFileSync(path.resolve(__dirname,'phd.txt'), 'utf8')
        const lines = data.split('\n')

        let count = 0
        const warnings = []
        for (let line of lines) {
            count ++
            console.log(`>>> importing entry ${count}/${lines.length} <<<<`)
            // if (count > 10) break
            try {
                const fields = line.split('|')
                const firstName = fields[1]
                const lastName = fields[0]
                const url = fields[2]
                console.log(`url: ${url} for ${firstName} ${lastName}`)
                if (!url) continue
                const response = await axios.get(url)
                const data = response.data
                const $ = cheerio.load(data)
                // extract affiliation from <span> with style="font-size: 1.2em;"
                const style="color: #006633; margin-left: 0.5em"
                const affiliation = $('span').filter((i, el) => $(el).attr('style').startsWith('color:\n')).text().trim()
                const year = $('#paddingWrapper').children()[6].children[1].children[2].data.trim()
                const title = $('#thesisTitle').text().trim()
                const person = await findPerson(people, firstName, lastName, affiliation)
                const gene_id = url.split('id=')[1]

                if (person===null) {
                    warnings.push(`person not found: ${firstName} ${lastName} ${affiliation}`)
                    continue
                }

                // insert gene_id in person
                await people.updateOne({ _id: person._id }, { $set: { genealogyId: gene_id } })

                const advisors_list = $('p').filter((i, el) => ( $(el).attr('style')  && $(el).attr('style').includes('2.75ex') )).children().map(
                    (j, x) => {
                        if (x.children[0]) {
                            const yy = JSON.stringify(x.children[0].data)
                            return yy
                        }
                        return null
                    }).filter(
                        (x) => x !== null
                    )

                let notes = ''
                notes += `genealogy url: ${url}\n`
                let advisors = []
                for (j = 0; j < advisors_list.length; j++) {
                    const fullAdvisorName = advisors_list[j].toString().replaceAll('"', '')
                    const p = await findPerson2(people, fullAdvisorName)
                    if (p === null) {
                        notes += `advisor: ${fullAdvisorName}\n`
                        warnings.push(`advisor not found: ${fullAdvisorName} for ${firstName} ${lastName} ${affiliation}`)
                    } else {
                        advisors.push(p._id)
                    }
                }

                const thesis = {
                    person: person._id,
                    affiliation,
                    date: new Date(`${year}-01-01`),
                    title,
                    advisors,
                    notes,
                }

                console.log(JSON.stringify(thesis))
                await db.collection('theses').insertOne(thesis)
            } catch (e) {
                console.log(e.stack)
                warnings.push(`error: ${e}`)
            }
        }
        console.log(`++++++++++++++ migration imported ${count} theses`)
        console.log(`++++++++++++++ found ${warnings.length} warnings:`)
        warnings.forEach(w => console.log(`* ${w}`))
        return true
    },

    D20230222_thesis_add_missing_SSDs: async function(db) {
        const staff = db.collection('staffs')
        // load all staff members with startDate and endDate
        // null or enclosing today
        const today = new Date()
        const staff_members = await staff.find({
            $or: [
                { startDate: { $lte: today } },
                { startDate: null },
            ],
            $or: [
                { endDate: { $gte: today } },
                { endDate: null },
            ]
        }).toArray()
        const ssds = Object.fromEntries([...staff_members]
            .map(x => [x.person, x.SSD])
            .filter(x => x[1]))
        // console.log(ssds)
        const theses = db.collection('theses')
        const all_theses = await theses.find({ 
                advisors: { $exists: true, $ne: [] }, 
                SSD: { $exists: false } })
            .toArray()
        for (let thesis of all_theses) {
            let SSD = null
            for (let advisor of thesis.advisors) {
                if (ssds[advisor]) {
                    SSD = ssds[advisor]
                    break
                }
            }
            if (SSD) {
                console.log(`setting SSD ${SSD} for thesis ${thesis._id}`)
                await theses.updateOne({ _id: thesis._id }, { $set: { SSD } })
            }
        }
        return true
    },

    D20230222_fill_theses_affiliation_2: async function(db) {
        const people = db.collection('people')
        const theses = db.collection('theses')
        const path = require('path')
        
        // read data from file "phd.txt"
        const fs = require('fs')
        const data = fs.readFileSync(path.resolve(__dirname,'phd.txt'), 'utf8')
        const lines = data.split('\n')
    
        let count = 0
        for (let line of lines) {
            const fields = line.split('|')
            const firstName = fields[1]
            const lastName = fields[0]
            const url = fields[2]
            if (!url) continue
            count ++
            const gene_id = url.split('id=')[1]

            const person = await people.findOne({ genealogyId: gene_id })
            console.log(`person: ${person._id} ${person.firstName} ${person.lastName}`)
            // find all thesis with missing or empty affiliation
            const thesis = await theses.findOne({ person: person._id })
            if (!thesis) continue
            console.log(`setting affiliation of thesis: ${thesis._id} was ${thesis.institution}`)
            await theses.updateOne({ _id: thesis._id }, { $set: { institution: 'Università di Pisa' } })
        }
        await theses.updateMany({}, { $unset: { affiliation: '' } })
        return true
    },

    D20230312_fill_institutions_3: async function(db) {
        const institutions = db.collection('institutions')
        const people = db.collection('people')
        const theses = db.collection('theses')
        console.log(`clearing institutions collection`)
        await institutions.deleteMany({})
        const all_people = await people.find({}).toArray()
        let all_institutions = new Set()
        for (person of all_people) {
            if (person.affiliation) {
                affiliations = person.affiliation.split(' and ')
                affiliations.forEach(aff => all_institutions.add(aff))
            }
        }
        const all_theses = await theses.find({}).toArray()
        for (thesis of all_theses) {
            if (thesis.institution) {
                all_institutions.add(thesis.institution)
            }
        }
        console.log(`found ${all_institutions.size} institutions`)
        for (institution of all_institutions) {
            await db.collection('institutions').insertOne({ name: institution })
        }
        return true
    },

    D20230316_fill_person_affiliations: async function(db) {
        const people = db.collection('people')
        const institutions = db.collection('institutions')
        for (person of await people.find({}).toArray()) {
            const aff = person.affiliation
            if (aff) {
                const affiliations = aff.split(' and ')
                const institution_ids = []
                for (affiliation of affiliations) {
                    const aff_id = await institutions.findOne({ name: affiliation })
                    if (aff_id) {
                        institution_ids.push(aff_id._id)
                    } else {
                        console.log(`cannot find institution ${affiliation} for person ${person.lastName}`)
                    }
                }
                if (institution_ids.length > 0) {
                    console.log(`setting affiliation for ${person.lastName} to ${institution_ids}`)
                    await people.updateOne({ _id: person._id }, { $set: { affiliations: institution_ids } })
                }
            }
        }
        return true
    },
}


async function migrate(db, options) {
    const {apply, clean} = {
        apply: false, 
        clean: false, 
        ...options }

    const configs = db.collection('config')
    let config = await configs.findOne({})
    if (config === null) {
        console.log(`no config document in database. Create empty config.`)
        config = { migrations: [] }
        await db.collection('config').insertOne(config)
    }
    
    async function update() {
        await configs.updateOne(
            { _id: config._id }, 
            { $set: {migrations: config.migrations }})
        }

    console.log("Migrations: (*) applied, (+) new, (-) removed")

    const all_migrations = [...new Set([...Object.keys(migrations), ...config.migrations])]
    for (const name of all_migrations.sort()) {
        if (config.migrations.includes(name)) {
            if (migrations.hasOwnProperty(name)) {
                console.log(` (*) ${name}`)
            } else {
                if (clean) {
                    config.migrations = config.migrations.filter(m => m !== name)
                    console.log(` (-) ${name} (removed!)`)
                } else {
                    console.log(` (-) ${name}`)
                }
            }
        } else {
            console.log(` (+) ${name}`)
        }
    }
    if (clean) {
        await update()
    }

    if (apply) {
        for (const [name, run] of Object.entries(migrations)) {
            if (config.migrations.includes(name)) continue
            console.log(`===> apply migration: ${name}`)
            if (await run(db)) {
                // migrazione applicata!
                config.migrations.push(name)
                await update()
                console.log(`migration ${name} OK!`)
            } else {
                console.log(`migration ${name} FAILED! ****`)
                return false
            }
        }
        console.log("===> all migrations applied!")
    }
    return true
}

module.exports.migrate = migrate