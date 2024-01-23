// Background worker handling notifications

const { setupDatabase } = require('./database')
const { sendEmail, setupSMTPAccount } = require('./email')
const Notification = require('./models/Notification')
const User = require('./models/User')

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
        { $match: { 'roles': { $regex: `^${channel}($|/)` }}},
    ])).map(x => x.email)

    return res
}

async function handleNotifications() {
    // console.log("=> Handling notifications")

    const notifications = await Notification.find()
    // console.log(notifications)
    for (const notification of notifications) {
        const emails = await getEmailsForChannel(notification.channel)
        try {
            if (emails.length>0) {
                await sendEmail(emails, [], 'Notifica da DM-MANAGER', notification.message)
            } else {
                console.log(`No emails found for channel ${notification.channel} (assign role: subscribe/${notification.channel})`)
            }
            await Notification.deleteOne({ _id: notification._id })
            console.log("Sent notification to: ", emails.length > 0 ? emails.join(", ") :"<nobody>")
        } catch (err) {
            console.log("Error while sending a notification")
            console.log(err)
        }
    }

    // await sendEmail([ 'leo@robol.it' ], [], 'Prova di email', 'xxx')
}

async function mainloop() {
    await setupDatabase()
    await setupSMTPAccount()

    await handleNotifications()
    setInterval(handleNotifications, 60000)
}

mainloop()

