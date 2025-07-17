/**
 * "migrations" contiene le migrazioni da applicare.
 * 
 * Se la funzione torna true il nome viene salvato
 * nel database e la migrazione non verrà più applicata.
 * 
 * Se la migrazione torna undefined o false
 * il nome non viene salvato e la migrazione verrà
 * applicata ogni volta che il server viene avviato.
 * Se la migrazione torna false il server non si avvia
 * se invece torna undefined il server si avvia comunque
 * 
 * Le migrazioni devono essere autoconsistenti, non bisogna
 * utilizzare i modelli perché potrebbero non corrispondere 
 * più allo stato del database
 */

const { default: axios } = require('axios')
const he = require('he')
const assert = require('assert')
const jsdom = require('jsdom')
const { ObjectId } = require('mongodb')

async function findPerson(people, firstName, lastName, affiliazione) {
    let p = await people.findOne({ firstName, lastName })
    if (p === null) {
        p = await people.insertOne({ 
            firstName, 
            lastName, 
            affiliation: affiliazione || "Università di Pisa",
            notes: `creato da migrazione\n***fix affiliation: ${affiliazione}\n`,
        })
        console.log(`Nuova persona creata: ${firstName} ${lastName}`)
        return p.insertedId
    } else {
        console.log(`Persona trovata: ${firstName} ${lastName} ${p._id}`)
        return p._id
    }
}

async function findPerson2(people, fullName, affiliazione) {
    const names = fullName.split(' ').filter(n => n !== '')
    let p = null
    if (names.length === 2) {
        return await findPerson(people, names[0], names[1], affiliazione)
    } else if (names.length ===3 && ['de','di','da','dal','del'].includes(names[1].toLowerCase())) {
        return await findPerson(people, names[0], `${names[1]} ${names[2]}`)
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
            return p[0]._id
        } else {
            return findPerson(people, fullName, '')
        }
    }
}

function parseHTML(html) {
    const dom = new jsdom.JSDOM(html, 'text/html')
    const doc = dom.window.document
    let out = parseElement(doc.body).trim()
    out = out.replace('\n\n\n', '\n\n')
    out = out.replace('\n\n\n', '\n\n')
    out = out.replace('\n\n\n', '\n\n')
    return out            
}

function parseElement(el) {
    const nodeName = el.nodeName.toLowerCase()
    if (nodeName === '#text') return el.textContent
    const children = [...el.childNodes].map((child, i) => 
        parseElement(child)).join('')
    switch (nodeName) {
        case 'body':
            return children
        case 'h4':
            return `#### ${children}`
        case 'h3':
            return `### ${children}`
        case 'h2':
            return `## ${children}`
        case 'h1':
            return `# ${children}`
        case 'p':
            return `${children}\n`
        case 'br':
            return `\n\n`
        case 'em':
        case 'i':
            return `*${children}*`
        case 'a':
            return `[${children}](${el.href})`
        case 'strong':
        case 'b':
            return `**${children}**`
        case 'ul':
        case 'ol':
            return `${children}\n`
        case 'li':
            return `* ${children}\n`
        case 'pre':
            return `\`\`\`\n${children}\n\`\`\`\n`
        case 'img':
            return `![${el.alt}](${el.src})`
        default: 
            console.log(`unexpected node ${nodeName}`)
            return children
    }
}

const migrations = { 
    D20221112_migration_test: async (db) => {
        return true
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
            console.log(`person: ${person?._id} ${person?.firstName} ${person?.lastName}`)
            // find all thesis with missing or empty affiliation
            const thesis = await theses.findOne({ person: person?._id })
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

    D20230318_fill_visit_affiliations: async function(db) {
        const visits = db.collection('visits')
        const institutions = db.collection('institutions')
        for (visit of await visits.find({}).toArray()) {
            const aff = visit.affiliation
            if (aff) {
                const affiliations = aff.split(' and ')
                const institution_ids = []
                for (affiliation of affiliations) {
                    let aff_id = await institutions.findOne({ name: affiliation })
                    if (!aff_id) {
                        const res = await institutions.insertOne({ name: affiliation })
                        aff_id = res.insertedId
                        console.log(`added institution ${affiliation} ${aff_id} for visit ${visit._id}`)
                    }
                    institution_ids.push(aff_id._id)
                }
                if (institution_ids.length > 0) {
                    console.log(`setting affiliations for visit ${visit._id} to ${institution_ids}`)
                    await visits.updateOne({ _id: visit._id }, { $set: { affiliations: institution_ids } })
                }
            }
        }
        return true
    },

    D20230322_fill_thesis_affiliations: async function(db) {
        const theses = db.collection('theses')
        const institutions = db.collection('institutions')
        await theses.updateMany({}, { $rename: { institution: 'old_institution' } })
        for (thesis of await theses.find({}).toArray()) {
            const affiliation = thesis.old_institution
            if (affiliation) {
                let aff_id = await institutions.findOne({ name: affiliation })
                if (!aff_id) {
                    const res = await institutions.insertOne({ name: affiliation })
                    aff_id = res.insertedId
                    console.log(`added institution ${affiliation} ${aff_id} for thesis ${thesis._id}`)
                } else {
                    aff_id = aff_id._id
                }
                console.log(`setting affiliation for thesis ${thesis._id} to ${aff_id}`)
                await theses.updateOne({ _id: thesis._id }, { $set: { institution: aff_id } })
            }
        }
        return true
    },

    D20230322_strip_theses_notes_2: async function(db) {
        const theses = db.collection('theses')
        await theses.updateMany({
            notes: { $regex: /^genealogy url: https:..www.genealogy.math.ndsu.nodak.edu.id.php.id=\d+$/ }
        }, { $set: { notes: '' } })
        return true
    },

    D20230322_strip_staff_notes_2: async function(db) {
        const staffs = db.collection('staffs')
        await staffs.updateMany({
            notes: { $regex: /^wordpressLink: https:..www.dm.unipi.it.people.[^\s]*$/ }
        }, { $set: { notes: '' } })
        return true
    },

    D20230418_create_indexes_1: async function(db) {
        db.collection('staffs').createIndex({startDate: 1, endDate: 1})
        db.collection('grants').createIndex({startDate: 1, endDate: 1})
        db.collection('forms').createIndex({startDate: 1, endDate: 1})
        db.collection('visits').createIndex({startDate: 1, endDate: 1})
        db.collection('logs').createIndex({when: 1})
        db.collection('formdatas').createIndex({form: 1})
        db.collection('roomassignments').createIndex({startDate: 1, endDate: 1})
        db.collection('theses').createIndex({date: 1})

        return true
    },

    D20230719_fill_person_alternative_emails: async function(db) {
        const people = db.collection("people")
        await people.updateMany(
            { alternativeEmails: { $exists: false }}, 
            { $set: { alternativeEmails: [] }})
        return true
    },

    D20230919_fill_form_require_authorization_1: async function(db) {
        const forms = db.collection("forms")
        await forms.updateMany(
            {},
            { $set: { requireAuthentication: true }})
        return true
    },

    D20231027_save_old_abstract_1: async function(db) {
        const seminars = db.collection('eventseminars')
        for(const seminar of await seminars.find({}).toArray()) {
            await seminars.updateOne({ _id: seminar._id }, 
                { $set: { oldAbstract: seminar.abstract } })
            }
        return true
    },

    D20231028_convert_html_to_markdown_1: async function(db) {
        const seminars = db.collection('eventseminars')
        const conferences = db.collection('eventconferences')
    
        for(const seminar of await seminars.find({}).toArray()) {
            const abstract = seminar.oldAbstract
            if (!abstract) continue
            const parsed = parseHTML(abstract)
            await seminars.updateOne({ _id: seminar._id },
                { $set: { abstract: parsed } })
            }
        
        return true
    },

    D20231029_rename_conference_description_1: async function(db) {
        const seminars = db.collection('eventconferences')
        await seminars.updateMany({}, { $rename: { notes: 'description' } })
        return true
    },

    D20231123_create_group_indexes: async function(db) {
        db.collection('groups').createIndex({startDate: 1, endDate: 1})
        return true
    },

    D20240106_rename_process_roles: async function(db) {
        const users = db.collection('users')
        for (const user of await users.find({}).toArray()) {
            user.roles = user.roles.map(role => role.replace('/api/v0/', ''))
            await users.updateOne({ _id: user._id }, { $set: { roles: user.roles } })
        }
        return true
    },

    D20240202_add_person_to_user_1: async function(db) {
        const users = db.collection('users')
        const people = db.collection('people')
        for (const user of await users.find({person: null}).toArray()) {
            if (!user.username) continue
            const ps = await people.aggregate([{
                $match: { $or: [
                    {email: user.username },
                    {alternativeEmails: user.username }
                ]}}]).toArray()
            if (ps.length >=1) {
                if (ps.length > 1) {
                    console.log(`WARNING: multiple people found for user ${user.username}`)
                    continue
                }
                const person = ps[0]
                await users.updateOne({ _id: user._id }, { $set: { person: person._id } })
            }
        }
        return true
    },

    D20240302_multiple_speakers_in_seminars: async function(db) {
        const seminars = db.collection('eventseminars')
        const people = db.collection('people')
        for (const seminar of await seminars.find({}).toArray()) {
            if (seminar.speaker) {
                await seminars.updateOne({ _id: seminar._id }, { $set: { speakers: [seminar.speaker] } })
            }
        }
        return true
    },

    D20250214_default_square_format: async function(db) {
        const roomlabels = db.collection('roomlabels')
        await roomlabels.updateMany({ format: { $exists: false } }, { $set: { format: 'square' } })
        return true
    }/*,

    D20250717_update_dottorando_qualification: async function(db) {
        const staffs = db.collection('staffs')
        await staffs.updateMany(
            { qualification: "Dottorando" },
            { $set: { qualification: "Dottorando in Matematica" } }
        )
        return true
    }*/
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
            const ret = await run(db)
            if (ret) {
                // migrazione applicata!
                config.migrations.push(name)
                await update()
                console.log(`migration ${name} OK!`)
            } else {
                console.log(`migration ${name} FAILED! **** (${JSON.stringify(ret)})`)
                if (ret === undefined) return true
                return false
            }
        }
        console.log("===> all migrations applied!")
    }
    return true
}

module.exports.migrate = migrate