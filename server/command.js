const mongoose = require('mongoose')

const {setupDatabase} = require('./database')
const migrations = require('./migrations')
const {notifyVisit} = require('./controllers/processes/visits')

async function main() {
    await setupDatabase()
    await command()
    mongoose.connection.close()    
}

main()

async function command() {
    console.log(`

available command line options:

 clear-sessions, -c: clear sessions collection
 show-migrations: show migrations state
 apply-migrations: apply pending migrations
 clean-migrations: clean removed migrations
 notify-visit <visit_id> [<message>]: send visit notification message

    `)

    console.log(`given command line arguments: ${JSON.stringify(process.argv.slice(2))}`)

    const command = process.argv[2]
    const args = process.argv.slice(3)

    if (command === 'worker') {
        require('./worker') // non funziona
    } else if (command === 'clear-sessions' || command === '-c') {
        console.log('* clear sessions collection')
        await mongoose.connection.db.collection('sessions').deleteMany({})

    } else if (command === 'show-migrations') {
        console.log('* show migrations state')
        await migrations.migrate(mongoose.connection.db, {})

    } else if (command === 'apply-migrations') {
        console.log('* apply pending migrations')
        await migrations.migrate(mongoose.connection.db, {apply: true})

    } else if (command === 'clean-migrations') {
        console.log('* clean migrations collection')
        await migrations.migrate(mongoose.connection.db, {clean: true})

    } else if (command === 'notify-visit') {
        const visit_id = args[0]
        const message = args[1] || ''
        console.log(`* notify visit ${visit_id} with message: ${message}`)
        if (!visit_id) {
            console.log('<visit_id> required')
            return
        }
        await notifyVisit(visit_id, message)
    
    } else {
        console.log(`invalid argument: ${arg}`)
    }
}

  