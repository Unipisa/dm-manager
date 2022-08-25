require('dotenv').config() // read environment variabiles from .env
const { randomUUID } = require('crypto')

class Options {
    constructor() {
        const options = {
            SESSION_SECRET: randomUUID(),
            JWT_SECRET: randomUUID(),
            CORS_ORIGIN: "http://localhost:3000",
            PORT: "8000",
            OAUTH2_AUTHORIZE_URL: "https://iam.unipi.it/oauth2/authorize",
            OAUTH2_TOKEN_URL: "https://iam.unipi.it/oauth2/token",
            OAUTH2_CLIENT_ID: "R1K1DyQmplAQJHW77jO4WHMvnuca",
            OAUTH2_CLIENT_SECRET: null,
            OAUTH2_USERNAME_FIELD: "unipiUser",
            MONGO_URI: "mongodb://localhost:27017/dm-manager",
            ADMIN_USER: null,
            ADMIN_PASSWORD: null,
            SERVER_URL: null,
            EXCHANGE_CODE_FOR_TOKEN_SERVER_URL: null,
        }
        Object.entries(options).forEach(([key, val]) => {
            this[key] = process.env[key] || val
        })
        this.VERSION = require('../package.json').version
        if (!this.SERVER_URL) this.SERVER_URL = `http://localhost:${this.PORT}`
    }
}

module.exports = new Options()
