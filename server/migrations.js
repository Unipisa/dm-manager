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

async function findPerson(people, firstName, lastName, affiliazione) {
    let p = await people.findOne({ firstName, lastName })
    if (p === null) {
        p = await people.insertOne({ 
            firstName, 
            lastName, 
            affiliation: affiliazione || "Università di Pisa",
            created_by_migration: true,
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
            return findPerson(people, fullName, '*** fixme ***')
        }
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

    D20231013_copy_events_13: async function(db) {
        const people = db.collection('people')
        const conferences = db.collection('eventconferences')
        const seminars = db.collection('eventseminars')
        const conferencerooms = db.collection('conferencerooms')
        const seminarcategories = db.collection('seminarcategories')

        toUTCDate = s => {
            const sd = new Date(s * 1000)
            const date = new Date(sd.getFullYear(), sd.getUTCMonth(), sd.getUTCDate(), sd.getUTCHours(), sd.getUTCMinutes())
            return date
        }

        categoryToSSD = c => {
            return {
                '198': 'MAT/01',
                '162': 'MAT/02',
                '152': 'MAT/03',
                '200': 'MAT/04',
                '114': 'MAT/05',
                '190': 'MAT/06',
                '191': 'MAT/07',
                '154': 'MAT/08'
            }[c];
        }

        const room_mapping = {
            'Department of Mathematics, Aula Seminari.': 'Aula Seminari (DM)',
            'Aula Magna': 'Aula Magna (DM)',
            'Aula Seminari': 'Aula Seminari (DM)',
            'Scuola Normale Superiore, Aula Volterra.': 'Aula Volterra (SNS)',
            'Dipartimento di Matematica, Sala Seminari.': 'Aula Seminari (DM)',
            'Department of Mathematics, Aula Riunioni.': 'Aula Riunioni (DM)',
            'Aula Dini, Centro De Giorgi': 'Aula Dini (CRM)',
            'Aula Seminari - Dipartimento di Matematica': 'Aula Seminari (DM)',
            'Aula Riunioni - Dipartimento di Matematica': 'Aula Riunioni (DM)',
            'Aula Magna - Dipartimento di Matematica': 'Aula Magna (DM)',
            'CRM - SNS, Sala Conferenze - Palazzo Puteano.': 'Sala Conferenze (Palazzo Puteano)',
            'Aula Riunioni, Dipartimento di Matematica': 'Aula Riunioni (DM)',
            'Department of Mathematics, Aula Magna.': 'Aula Magna (DM)',
            'Dipartimento di Matematica, Aula Magna.': 'Aula Magna (DM)',

            'Aula 1 Dipartimento di Matematica.': 'Aula 1 (DM)',
            'Aula 2 Dipartimento di Matematica.': 'Aula 2 (DM)',
            'Aula Bianchi Lettere - Palazzo della Carovana': 'Aula Bianchi Lettere (SNS)',
            'Aula Bianchi Lettere (SNS).': 'Aula Bianchi Lettere (SNS)',
            'Aula Bianchi Scienze (SNS).': 'Aula Bianchi Scienze (SNS)',
            'Aula Centro De Giorgi.': 'Aula Centro De Giorgi.',
            'Aula Fermi, Palazzo della Carovana': 'Aula Fermi (SNS)',
            'Aula Magna - Dipartimento di Matematica.': 'Aula Magna (DM)',
            'Aula Magna (Dip. Matematica Applicata).': 'Aula Magna (ex-DMA).',
            'Aula Magna (Dipartimento di Matematica).': 'Aula Magna (DM)',
            'Aula Magna Polo Fibonacci, Pisa': 'Aula Magna (Polo Fibonacci)',
            'aula magna storica (palazzo della Sapienza)': 'Aula magna storica (Palazzo della Sapienza)',
            'Aula Magna, Department of Mathematics': 'Aula Magna (DM)',
            'Aula Magna, Dipartimento di Matematica': 'Aula Magna (DM)',
            'Aula Mancini (SNS).': 'Aula Mancini (SNS)',
            'Aula N, Polo Fibonacci': 'Aula N (Polo Fibonacci)',
            'Aula O1 - Polo Fibonacci': 'Aula O1 (Polo Fibonacci)',
            'Aula P1 - Polo Fibonacci': 'Aula P1 (Polo Fibonacci)',
            'Aula Riunioni.': 'Aula Riunioni (DM)',
            'Aula Riunioni (Dipartimento di Matematica).': 'Aula Riunioni (DM)',
            'Aula Riunioni, Department of Mathematics.': 'Aula Riunioni (DM)',
            'Aula riunioni, Dipartimento di matematica': 'Aula Riunioni (DM)',
            'Aula Riunioni': 'Aula Riunioni (DM)',
            'Aula seminari - Dipartimento di Matematica': 'Aula Seminari (DM)',
            'Aula Seminari e Riunioni': 'Aula Seminari e Riunioni (DM)',
            'Aula Seminari, Department of Mathematics': 'Aula Seminari (DM)',
            'Aula Seminari, Dipartimento di Matematica': 'Aula Seminari (DM)',
            'Aula seminari': 'Aula Seminari (DM)',
            'Aula Tonelli - Palazzo della Carovana': 'Aula Tonelli (SNS)',
            'Aula Tonelli (SNS).': 'Aula Tonelli (SNS)',
            'Aula Volterra - Palazzo della Carovana': 'Aula Volterra (SNS)',
            'Aula Volterra, Normale': 'Aula Volterra (SNS)',
            'Aula Volterra, Scuola Normale Superiore': 'Aula Volterra (SNS)',
            'BellaVista Relax Hotel': 'BellaVista Relax Hotel',
            'Centro De Giorgi - SNS ': 'Centro De Giorgi (SNS)',
            'Centro de Giorgi - SNS.': 'Centro De Giorgi (SNS)',
            'Centro De Giorgi - SNS.': 'Centro De Giorgi (SNS)',
            'Collegio Puteano, SNS': 'Collegio Puteano (SNS)',
            'conferenza telematica': 'conferenza telematica',
            'CRM - SNS.': 'Centro De Giorgi (SNS)',
            'CRM SNS.': 'Centro De Giorgi (SNS)',
            'Department of Mathematics and online': 'Department of Mathematics and online',
            'Department of Mathematics, Aula Magna': 'Aula Magna (DM)',
            'Department of Mathematics, Aula Riunioni': 'Aula Riunioni (DM)',
            'Department of Mathematics, Aula Seminari': 'Aula Seminari (DM)',
            'Department of Mathematics, Aula Seminari`.': 'Aula Seminari (DM)',
            'Department of Mathematics, N1.': 'Aula N1 (Polo Fibonacci)',
            'Department of Mathematics, Sala Seminari': 'Aula Seminari (DM)',
            'Department of Mathematics, University of Pisa, Aula Magna': 'Aula Magna (DM)',
            'Department of Mathematics, University of Pisa': 'Dipartimento di Matematica',
            'Dipartimenti di Matematica, Aula Seminari.': 'Aula Seminari (DM)',
            'Dipartimento di Matematica Università di Pisa, Aula magna': 'Aula Magna (DM)',
            'Dipartimento di Matematica, Aula Magna': 'Aula Magna (DM)',
            'Dipartimento di Matematica, Aula Riunioni.': 'Aula Riunioni (DM)',
            'Dipartimento di Matematica, Aula seminari.': 'Aula Seminari (DM)',
            'Dipartimento di Matematica, Aula Seminari.': 'Aula Seminari (DM)',
            'Dipartimento di Matematica, Sala Riunioni.': 'Aula Riunioni (DM)',
            'Dipartimento di Matematica, Sala Riunioni': 'Aula Riunioni (DM)',
            'Dipartimento di Matematica, Università di Pisa e SNS, Pisa': 'Dipartimento di Matematica, Università di Pisa e SNS, Pisa',
            'Dipartimento di Matematica, Università di Pisa, Aula Magna': 'Aula Magna (DM)',
            'Dipartimento di Matematica': 'Dipartimento di Matematica',
            'Dipartimetno di Matematica, Aula Seminari.': 'Aula Seminari (DM)',
            'Dobbiaco (Toblach)': 'Dobbiaco (Toblach)',
            'Google Meet.': 'Google Meet',
            'Google Meet': 'Google Meet',
            'Grand Hotel Tettuccio Montecatini, Sala Conferenze': 'Grand Hotel Tettuccio Montecatini, Sala Conferenze',
            'IHÉS, France': 'IHÉS, France',
            'Levico Terme, Italy': 'Levico Terme, Italy',
            'Museo del Calcolo, Pisa': 'Museo del Calcolo, Pisa',
            'Online ( https://seminarimap.wixsite.com/seminarimap )': 'Online ( https://seminarimap.wixsite.com/seminarimap )',
            'Palazzo della Carovana, Aula Bianchi Lettere': 'Aula Bianchi Lettere (SNS)',
            'Palazzo della Carovana, Aula Russo': 'Aula Russo (SNS)',
            'Palazzone di Cortona': 'Palazzone di Cortona',
            'Pisa, “Polo Congressuale Le Benedettine” (June 6-7-8), “Aula Magna Pontecorvo” (June 10-11)': 'Polo Congressuale Le Benedettine',
            'Polo Carmignani, Aula Magna': 'Aula Magna (Polo Carmignani)',
            'Sala Conferenze (Puteano, Centro De Giorgi).': 'Sala Conferenze (Collegio Puteano)',
            'Sala conferenze, Centro De Giorgi': 'Sala conferenze (CRM)',
            'Sala delle Riunioni (Dip. Matematica Applicata).': 'Aula Riunioni (ex-DMA)',
            'Sala Riunioni (Dip. Matematica).': 'Aula Riunioni (DM)',
            'Sala Riunioni (Dipartimento di Matematica).': 'Aula Riunioni (DM)',
            'Sala Riunioni (Puteano, Centro De Giorgi).': 'Aula Riunioni (DM)',
            'Sala Seminari .': 'Aula Seminari (DM)',
            'Sala Seminari (Dip. Matematica).': 'Aula Seminari (DM)',
            'Sala Seminari (Dipartimento di Matematica).': 'Aula Seminari (DM)',
            'Sala Seminari del Dipartimento di Matematica': 'Aula Seminari (DM)',
            'Sala Seminari.': 'Aula Seminari (DM)',
            'sala seminari': 'Aula Seminari (DM)',
            'Sala seminari': 'Aula Seminari (DM)',
            'Sala Seminari': 'Aula Seminari (DM)',
            'Scuola Normale Superiore, Aula Mancini.': 'Aula Mancini (SNS)',
            'Scuola Normale Superiore, Pisa, Aula Mancini.': 'Aula Mancini (SNS)',
            'SISSA - Trieste': 'SISSA - Trieste',
            'SNS - Centro De Giorgi.': 'Aula Seminari (CRM)',
            'SNS - Centro De Giorgi - Aula Seminari.': 'Aula Seminari (CRM)',
            'SNS - Centro De Giorgi - Aula Seminari': 'Aula Seminari (CRM)',
            'SNS - CRM, Sala Seminari.': 'Aula Seminari (CRM)',
            'SNS - Palazzo della Carovana.': 'Palazzo della Carovana (SNS)',
            'SNS – Centro De Giorgi – Aula Seminari.': 'Aula Seminari (CRM)',
            'SNS Aula Dini, Palazzo del Castelletto': 'Aula Dini (CRM)',
            'SNS, Aula Mancini.': 'Aula Mancini (SNS)',
            'SNS, Pisa': 'Palazzo della Carovana (SNS)',
            'Università degli Studi di Milano La Statale, Dipartimento di Matematica': 'Università degli Studi di Milano La Statale, Dipartimento di Matematica',
            Online: 'Online',
            Teams: 'Teams',
          }
          
          const category_mapping = {
              "colloquium": 175,
              "algebra-seminar":	3,
              "algebraic-and-arithmetic-geometry-seminar":	75,
              "analysis-seminar":	159,
              "analysis-seminar2":  77,
              "baby-geometri-seminar":	79,
              "dynamical-systems-seminar":	78,
              "geometry-seminar":	85,
              "il-teorema-piu-bello":	5,
              "logic-seminar":	23,
              "mathematical-physics-seminar":	6,
              "number-theory-seminar":	7,
              "probability-stochastic-analysis-statistics-seminar":	73,
              "seminar-on-combinatorics-and-lie-theory-and-topology":	33,
              "seminar-on-numerical-analysis":	63,
              "seminari-map":	21,
        }

        await people.deleteMany({created_by_migration: true})
        await conferences.deleteMany({})
        await conferencerooms.deleteMany({})
        await seminars.deleteMany({})
        await seminarcategories.deleteMany({})

        const created_rooms = {}

        for (const [room_key, room_name] of Object.entries(room_mapping)) {
            if (created_rooms[room_name] === undefined) {
                const newroom = await conferencerooms.insertOne({
                    name: room_name,
                })

                created_rooms[room_name] = newroom.insertedId
            }
        }

        const created_categories = {}

        for (const [category, label] of Object.entries(category_mapping)) {
            const newcategory = await seminarcategories.insertOne({
                    name: category,
                    label: `${label}`,
                })
            const find = await seminarcategories.findOne({ label : `${label}`})
            created_categories[label] = find._id
        }

        const lst = (await seminarcategories.find()).toArray()
        console.log(JSON.stringify({lst}))

        console.log(JSON.stringify({created_categories}))

        var offset = 0;
        const batch_size = 97;

        const alreadyLoaded = {}
        var res = await axios.get(`https://www.dm.unipi.it/wp-json/wp/v2/unipievents?per_page=${batch_size}&offset=0`)
        while (res.data.length > 0) {
            const events = res.data
            for (const event of events) {   
                const taxonomy = event.unipievents_taxonomy             
                const title = he.decode(event.title.rendered)
                const conferenceRoom = created_rooms[room_mapping[event.unipievents_place]]
                const startDatetime = toUTCDate(event.unipievents_startdate)
                const duration = (event.unipievents_enddate - event.unipievents_startdate) / 60
                const notes = event.content.rendered
                const abstract = event.content.rendered
                const oldUrl = event.link

                if (event.unipievents_place && !conferenceRoom) {
                    console.log("**************** Cannot find room: ${event.unipievents_place}")
                    console.log("conferenceRoom", JSON.stringify({conferenceRoom, unipi_place: event.unipievents_place}))
                }

                if (taxonomy.includes(90)) {
                    console.log("> Conference", event.link)

                    const object = {
                        title,
                        startDate: toUTCDate(event.unipievents_startdate),
                        endDate: toUTCDate(event.unipievents_enddate),
                        SSD: event.unipievents_taxonomy.map(categoryToSSD).filter(x => x),
                        url: "",
                        oldUrl,
                        conferenceRoom,
                        grants: [],
                        notes,
                    }
                    if (! await conferences.insertOne(object)) {
                        console.log("Error")
                        return false
                    }
                } else if (taxonomy.includes(175)) {
                    console.log("> Colloquium", event.link)
                    const speaker = title.split('–')[1].split('(')[0].trim()
                    const affiliation = title.split('–')[1].split('(')[1].trim().trim(')')   
                    const person = await findPerson2(people, speaker, affiliation)
                    const object = {
                        title: title.split('–')[0].trim(),
                        category: created_categories['colloquium'],
                        conferenceRoom,
                        startDatetime,
                        speaker: person,
                        duration,
                        abstract,     
                        oldUrl,               
                        grants: [],
                    }
                    await seminars.insertOne(object)
                } else {
                    // console.log("> Seminar", event.link)
                    console.log(taxonomy, event.link)
                    // console.log("title", title)
                    const category = created_categories[taxonomy[0]] || created_categories[taxonomy[1]]

                    let speaker = null
                    try {
                        speaker = title.split('–')[1].split('(')[0].trim()
                    } catch (e) {
                    }
                    let affiliation = ""
                    try {
                        affiliation = title.split('–').at(-1).split('(')[1].trim().trim(')')   
                    } catch (e) {
                    }
                    const person = speaker 
                        ? await findPerson2(people, speaker, affiliation)
                        : null
                    const object = {
                        speaker: person,
                        title: title.split('–')[0].trim(),
                        conferenceRoom,
                        startDatetime,
                        duration,
                        category,
                        grants: [],
                        oldUrl,
                        abstract: notes,                    
                    }
                    // console.log(object)
                    if (alreadyLoaded[object.title] === undefined) {
                        alreadyLoaded[object.title] = true
                        await seminars.insertOne(object)
                    }
                }
                
            }
            res = await axios.get(`https://www.dm.unipi.it/wp-json/wp/v2/unipievents?per_page=${batch_size}&offset=${offset}`)
            console.log(`>>>> BATCH ${offset}`)
            offset += batch_size
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