const { serve } = require('./server')

if (process.env.NODE_ENV !== 'test') {
    serve() // start server
}