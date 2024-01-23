// Background worker handling notifications

const { setupDatabase } = require('./database')
const { sendEmail, setupSMTPAccount } = require('./email')
const Notification = require('./models/Notification')
const User = require('./models/User')
const config = require('./config')

const ROLE_PREFIX = 'notify/'

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
    setInterval(handleNotifications, interval)
}

mainloop()

