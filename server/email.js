const nodemailer = require("nodemailer");
const config = require('./config')

var transporter = undefined

// If we have an SMTP configuration, we use it; otherwise, we default
// to a nodemailer account. 
async function setupSMTPAccount() {
    if (transporter !== undefined) {
        return
    }

    if (config.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: config.SMTP_HOST, 
            port: 25, 
            secure: false
        })
    }
    else {
        console.log("No SMTP Configuration provided, creating a test account on Ethereal ... ")
        try {
            account = await nodemailer.createTestAccount()
            transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: {
                    user: account.user,
                    pass: account.pass
                }
            });
        } catch (err) {
            console.log("Failed to create a test account")
            console.log(err)
        }

        if (transporter !== undefined) {
            console.log("Ethereal account created")
            console.log("You may see the emails sent by logging in at " + account.web + " with credentials:")
            console.log(" - username: " + account.user)
            console.log(" - password: " + account.pass)
        }
    }
}

async function sendEmail(recipients, cc, subject, body) {  
    const info = await transporter.sendMail({
        from: 'noreply@manage.dm.unipi.it',
        to: recipients.join(", "),
        cc: cc.join(", "),
        subject,
        text: body,
        // html: ""
    })

    if (transporter.options.host === 'smtp.ethereal.email') {
        console.log("A message has been sent. Check it out at: " + nodemailer.getTestMessageUrl(info))
    }
}

module.exports = { sendEmail, setupSMTPAccount }