const {
    Schema,
    model,
    ObjectId,
    createdBy,
    updatedBy,
} = require('./Model')

const schema = new Schema({
    channel: { type: String, label: 'tipo', required: true },
    // a new notification with same code will overwrite the previous one
    code: { type: String, label: 'codice', required: true },
    message: { type: String, label: 'messaggio', default: '', required: true },
    notifiedEmails: { type: [String], label: 'email notificate', default: [], required: true },
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Notification = model('Notification', schema)
module.exports = Notification

async function notify(channel, code, message) {
    await Notification.deleteMany({ channel, code })
    await Notification.create({
        channel,
        code,
        message,
    })   
}

module.exports.notify = notify