require('dotenv').config() // read environment variabiles from .env
const { randomUUID } = require('crypto')

class Options {
    constructor() {
        const options = {
            STATIC_FILES_PATH: (process.env.NODE_ENV === 'production' ? 'build' : 'public'),
            SESSION_SECRET: randomUUID(),
            JWT_SECRET: randomUUID(),
            CORS_ORIGIN: "http://localhost:3000", // comma separated URLS
            PORT: "8000",
            OAUTH2_AUTHORIZE_URL: "https://iam.unipi.it/oauth2/authorize",
            OAUTH2_TOKEN_URL: "https://iam.unipi.it/oauth2/token",
            OAUTH2_USERINFO_URL: "https://iam.unipi.it/oauth2/userinfo",
            OAUTH2_LOGOUT_URL: "https://iam.unipi.it/oidc/logout",
            OAUTH2_CLIENT_ID: null,
            OAUTH2_CLIENT_SECRET: null,
            OAUTH2_USERNAME_FIELD: "email",
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
        if (this.SERVER_URL === null) this.SERVER_URL = `http://localhost:${this.PORT}`
        if (this.REACT_APP_SERVER_URL === undefined) process.env.REACT_APP_SERVER_URL = this.SERVER_URL
    }
}

module.exports = new Options()
