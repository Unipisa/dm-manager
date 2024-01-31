// Background worker handling notifications

const { setupDatabase } = require('./database')
const { sendEmail, setupSMTPAccount } = require('./email')
const Notification = require('./models/Notification')
const Visit = require('./models/Visit')
const User = require('./models/User')
const config = require('./config')
var cron = require('node-cron');

const { personRoomAssignmentPipeline } = require('./models/RoomAssignment')

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

    // Se oggi è un giorno feriale, aggiungiamo un giorno; se è venerdì, andiamo al lunedì. Altrimenti, niente notifica
    switch (today.getDay()) {
        case 1:
        case 2:
        case 3: // Mon -- Wed we notify for the day after
            startDate.setDate(today.getDate() + 1)
            endDate.setDate(today.getDate() + 2)
            break;
        case 4: // Thursday we notification for Fri -- Sun
            startDate.setDate(today.getDate() + 1)
            endDate.setDate(today.getDate() + 3)
            break;
        case 5: // Fri we notify for Mon
            startDate.setDate(today.getDate() + 3)
            endDate.setDate(today.getDate() + 4)
            break;
        default:
            return; // No notification in the weekend

    }

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

    // Troviamo le visite che iniziano oggi, e le riportiamo alla segreteria.
    // Questa e-mail viene inviata solo se c'è effettivamente qualcosa da comunicare.
    const res = await Visit.aggregate(visit_pipeline)

    if (res.length == 0) {
        return
    }

    // Prepare the email
    const visitorList = res.map(x => {
        let text = ""
        const visitorName = `${x.person.firstName} ${x.person.lastName}`
        var affiliation = ""
        if (x.affiliations.length > 0) {
            affiliation = "(" + x.affiliations.map(x => x.name).join(", ") + ")"
        }
        text += `Visitatore: ${visitorName} ${affiliation} ${x.person?.email||""}\n`
        text += `Periodo: ${x.startDate ? x.startDate.toLocaleDateString('it-IT') : ""} -- ${x.endDate ? x.endDate.toLocaleDateString('it-IT') : ""}\n`
        for (const person of x.referencePeople) {
            text += `Referente: ${person.firstName} ${person.lastName}\n`
        }
        if (!x.requireRoom) text += "Stanza non richiesta\n"
        if (x.roomAssignments.length > 0) {
            text += "Assegnazioni stanze: "
            text += x.roomAssignments.map(x => {
                r = x.room
                start = x.startDate?.toLocaleDateString('it-IT') || ""
                end = x.endDate?.toLocaleDateString('it-IT') || ""
                return `Edificio ${r.building}, Piano ${r.floor}, Stanza ${r.number} (${start} -- ${end})`
            }).join(" - ")
        }         
        return text
    }).join("\n\n")

    const emailBody = `
I seguenti visitatori sono in arrivo nei prossimi giorni:

${visitorList}
`

    // console.log(emailBody)

    const emails = await getEmailsForChannel('portineria')
    console.log(emails)
    if (emails.length > 0)
        await sendEmail(emails, [], 'Visitatori in arrivo nei prossimi giorni', emailBody)
}

async function getEmailsForChannel(channel) {
    if (! channel) {
        console.log("Warning: empty channel in getEmailsForChannel(); ignoring")
        return []
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
    console.log("=> Handling notifications")

    const notifications = await Notification.find()
    // console.log(notifications)
    for (const notification of notifications) {
        const emails = await getEmailsForChannel(notification.channel)
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
    const interval = parseInt(config.WORKER_NOTIFICATION_INTERVAL)
    console.log(`Starting worker, interval: ${interval}ms`)
    await setupDatabase()
    await setupSMTPAccount()

    await handleNotifications()

    // Setup the cron schedule
    scheduleCronJob('0 6 * * *', notificaPortineria)

    setInterval(handleNotifications, interval)
}

mainloop()

