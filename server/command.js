const mongoose = require('mongoose')

const {setupDatabase} = require('./database')
const migrations = require('./migrations')

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

    `)

    console.log(`given command line arguments: ${JSON.stringify(process.argv.slice(2))}`)

    for (let arg of process.argv.slice(2)) {
        if (arg === 'worker') {
            
        } else if (arg === 'clear-sessions' || arg === '-c') {
            console.log('* clear sessions collection')
            await mongoose.connection.db.collection('sessions').deleteMany({})

        } else if (arg === 'show-migrations') {
            console.log('* show migrations state')
            await migrations.migrate(mongoose.connection.db, {})

        } else if (arg === 'apply-migrations') {
            console.log('* apply pending migrations')
            await migrations.migrate(mongoose.connection.db, {apply: true})

        } else if (arg === 'clean-migrations') {
            console.log('* clean migrations collection')
            await migrations.migrate(mongoose.connection.db, {clean: true})

        } else {
            console.log(`invalid argument: ${arg}`)
        }
    }
}

  