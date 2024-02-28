// Background worker handling notifications

const { setupDatabase } = require('./database')
const { sendEmail, setupSMTPAccount } = require('./email')
const Notification = require('./models/Notification')
const Visit = require('./models/Visit')
const User = require('./models/User')
const config = require('./config')
var cron = require('node-cron');

const { personRoomAssignmentPipeline } = require('./models/RoomAssignment')
const RoomAssignment = require('./models/RoomAssignment')

const ROLE_PREFIX = 'notify/'

function scheduleCronJob(cron_format, f) {
    cron.schedule(cron_format, f, {
        scheduled: true,
        timezone: "Europe/Rome"
    });
}

// Possiamo pensare di migrare queste routine altrove, ad esempio dentro i controller, ed importarle semplicemente qui.
async function notificaPortineria() {
    console.log("=> Notifica per la portineria")

    const today = new Date(); today.setHours(0, 0, 0, 0); 
    const startDate = new Date(today)
    const endDate = new Date(today)

    switch (today.getDay()) {
        case 1: // Mon we notify for the same day and the day after
            startDate.setDate(today.getDate())
            endDate.setDate(today.getDate() + 2)
            break;
        case 2:
        case 3: // Tue and Wed we notify for the day after
            startDate.setDate(today.getDate() + 1)
            endDate.setDate(today.getDate() + 2)
            break;
        case 4: // Thur we notification for Fri -- Sun
            startDate.setDate(today.getDate() + 1)
            endDate.setDate(today.getDate() + 3)
            break;
        case 5: // Fri we notify for next week
            startDate.setDate(today.getDate() + 3)
            endDate.setDate(today.getDate() + 9)
            break;
        default:
            return; // No notification in the weekend
    }

    // Facciamo una query per vedere tutte le stanze che vengono assegnate
    // queste comprenderanno i visitatori, ma anche cambi di ufficio del 
    // personale, e/o nuove entrate.
    const rooms_pipeline = [
        { $match: { 
            startDate: { $gte: startDate, $lt: endDate }
        }},
        { $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'person',
            pipeline: [
                {$project: {
                    _id: 1, firstName: 1, lastName: 1, email: 1, affiliations: 1
                }}
            ]
        }},
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'rooms',
            localField: 'room',
            foreignField: '_id',
            as: 'room',
            pipeline: [
                {$project: {
                    _id: 1, building: 1, floor: 1, number: 1
                }}
            ]
        }},
        { $unwind: {
            path: '$room',
            preserveNullAndEmptyArrays: true
        }},
        { $lookup: {
            from: 'institutions',
            localField: 'person.affiliations', 
            foreignField: '_id',
            as: 'person.affiliations'
        }},
    ]

    const rooms_res = await RoomAssignment.aggregate(rooms_pipeline)

    // Facciamo una query per vedere tutte le visite della prossima settimana
    // Queste vengono inviate solo il venerdì
    const visit_pipeline = [
        { $match: { 
            startDate: { $gte: startDate, $lt: endDate }
        }}, 
        { $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'person',
            pipeline: [
                {$project: {
                    _id: 1, firstName: 1, lastName: 1, email: 1,
                }}
            ]
        }},
        { $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true
        }},
        { $lookup: {
            from: 'people',
            localField: 'referencePeople',
            foreignField: '_id',
            as: 'referencePeople',
            pipeline: [
                {$project: {
                    _id: 1, firstName: 1, lastName: 1
                }}
            ]
        }},
        ...personRoomAssignmentPipeline(),
        {$lookup: {
            from: 'institutions',
            localField: 'affiliations',
            foreignField: '_id',
            as: 'affiliations',
            pipeline: [
                {$project: {
                    _id: 1,
                    name: 1,
                    code: 1,
                    city: 1,
                    country: 1,
                }}
            ]
        }},
    ]

    const visits_res = await Visit.aggregate(visit_pipeline)

    if (today.getDay() == 5 && visits_res.length == 0 && rooms_res.length == 0) {
        return
    } 
    if (rooms_res.length == 0) {
        return
    }

    // Prepare the email
    let changesList = ""
    try {
        changesList = rooms_res.map(x => {
            let text = ""
            text += `Nome, cognome e indirizzo email: ${x.person.firstName} ${x.person.lastName}, ${x.person?.email||""}\n`
            var affiliation = ""
            if (x.person.affiliations.length > 0) {
                affiliation = x.person.affiliations.map(x => x.name).join(", ")
            }        
            text += `Affiliazione: ${affiliation}\n`
            const r = x.room
            const start = x.startDate?.toLocaleDateString('it-IT') || ""
            const end = x.endDate?.toLocaleDateString('it-IT') || ""
            const buildingName = r.building === 'X' ? 'Ex Albergo' : r.building;
            text += `Ufficio in Dipartimento assegnato: Edificio ${buildingName}, Piano ${r.floor}, Stanza ${r.number}\n`
            text += `Periodo: dal ${start} al ${end}`
            return text
        }).join("\n\n")
    
    }
    catch (e) {
        changesList = "Si è verificato un errore nella generazione di questa lista"
        console.log(e)
    }

    const visitorList = visits_res.map(x => {
        let text = ""
        text += `Nome, cognome e indirizzo email: ${x.person.firstName} ${x.person.lastName}, ${x.person?.email||""}\n`
        var affiliation = ""
        if (x.affiliations.length > 0) {
            affiliation = x.affiliations.map(x => x.name).join(", ")
        }
        text += `Affiliazione: ${affiliation}\n`
        text += `Periodo: dal ${x.startDate ? x.startDate.toLocaleDateString('it-IT') : ""} al ${x.endDate ? x.endDate.toLocaleDateString('it-IT') : ""}\n`
        for (const person of x.referencePeople) {
            text += `Referente: ${person.firstName} ${person.lastName}\n`
        }
        if (!x.requireRoom) text += "Ufficio in Dipartimento: non richiesto"
        if (x.roomAssignments.length > 0) {
            text += "Ufficio in Dipartimento assegnato: "
            text += x.roomAssignments.map(x => {
                const r = x.room
                const buildingName = r.building === 'X' ? 'Ex Albergo' : r.building;
                return `Edificio ${buildingName}, Piano ${r.floor}, Stanza ${r.number}`
            }).join(" - ")
        } else {
            text += "Ufficio: da assegnare";
        }
        return text
    }).join("\n\n")

    const emailBody = `
${(today.getDay() == 5) ? `Le seguenti persone sono in arrivo la prossima settimana:

${visitorList}` : ''}

Le seguenti postazioni in uffici del Dipartimento sono state assegnate ${
    (today.getDay() == 4) ? 'tra domani e il weekend' : today.getDay() == 5 ? 'dalla prossima settimana' : (today.getDay() == 1 ? 'tra oggi e domani' : 'da domani')
  }:

${changesList}
`

    // console.log(emailBody)

    const emails = await getEmailsForChannel('portineria')
    if (emails.length > 0)
        await sendEmail(emails, [], today.getDay() === 5 ? 'Persone in arrivo e nuove assegnazioni di postazioni in Dipartimento' : 'Nuove assegnazioni di postazioni in Dipartimento', emailBody);
}

async function getEmailsForChannel(channel) {
    if (! channel) {
        console.log("Warning: empty channel in getEmailsForChannel(); ignoring")
        return []
    }

    // If it's an email, return it as is
    if (channel.includes('@')) {
        return [channel]
    }

    // Remove trailing slash, if any
    if (channel[channel.length - 1] == '/') {
        channel = channel.substr(0, channel.length - 1)
    }

    const res = Array.from(await User.aggregate([
        { $match: { roles: { $regex: `^${ROLE_PREFIX}${channel}($|/)` }}},
    ])).map(x => x.email)

    if (res.length == 0) {
        console.log(`Warning: No recipients are defined for channel ${channel}`)
    }

    return res
}

async function handleNotifications() {
    const now = new Date().toLocaleString('it-IT')
    console.log(`[${now}] Handling periodic notifications (WORKER_NOTIFICATION_INTERVAL = ${config.WORKER_NOTIFICATION_INTERVAL})`)

    const notifications = await Notification.find()
    for (const notification of notifications) {
        const emails = await getEmailsForChannel(notification.channel)
        const timestamp = notification.updatedAt || notification.createdAt
        const now = new Date()
        if (timestamp && now - timestamp < config.WORKER_NOTIFICATION_INTERVAL) {
            console.log(`Skipping notification ${notification.channel}/${notification.code} because it was updated too recently`)
            continue
        }
        try {
            if (emails.length>0) {
                await sendEmail(emails, [], 'Notifica da DM-MANAGER', notification.message)
            } else {
                console.log(`No emails found for channel ${notification.channel} (assign role: ${ROLE_PREFIX}${notification.channel})`)
            }
            await Notification.deleteOne({ _id: notification._id })
            console.log(`Sent notification ${notification.channel}/${notification.code} to: ${emails.length > 0 ? emails.join(", ") :"<nobody>"}`)
        } catch (err) {
            console.log(`Error while sending a notification ${notification.channel}/${notification.code}`)
            console.log(err)
        }
    }
}

async function mainloop() {
    try {
        console.log(`Starting worker`);
        await setupDatabase();
        await setupSMTPAccount();

        await handleNotifications();

        // Setup cron schedule
        scheduleCronJob('0 6 * * *', notificaPortineria);
        notificaPortineria();

        setInterval(handleNotifications, 30000); // 30 seconds
    } catch (error) {
        console.error('Error in mainloop:', error);
    }
}

mainloop()

