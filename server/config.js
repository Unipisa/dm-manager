const url = require('url')
require('dotenv').config() // read environment variabiles from .env
const { randomUUID } = require('crypto')
const { execSync } = require('child_process')

function current_branch(next) {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    } catch(err) {
        return null
    }
}

class Options {
    constructor() {
        const GIT_BRANCH = current_branch()

        const options = {
            SMTP_HOST: undefined,
            STATIC_FILES_PATH: (process.env.NODE_ENV === 'production' ? 'build' : 'public'),
            SESSION_SECRET: randomUUID(),
            JWT_SECRET: randomUUID(),
            // CORS_ORIGIN: "http://localhost:3000", // comma separated URLS
            PORT: "8000",
            SERVER_URL: "http://localhost:8000",
            OAUTH2_AUTHORIZE_URL: "https://iam.unipi.it/oauth2/authorize",
            OAUTH2_TOKEN_URL: "https://iam.unipi.it/oauth2/token",
            OAUTH2_USERINFO_URL: "https://iam.unipi.it/oauth2/userinfo",
            OAUTH2_LOGOUT_URL: "https://iam.unipi.it/oidc/logout",
            OAUTH2_CLIENT_ID: null,
            OAUTH2_CLIENT_SECRET: null,
            OAUTH2_USERNAME_FIELD: "email",
            MONGO_URI: "mongodb://localhost:27017/dm-manager",
            MONGO_TEST_URI: "mongodb://localhost:27017/dm-manager-test",
            ADMIN_USER: null,
            ADMIN_PASSWORD: null,
            SERVER_URL: "http://localhost:8000",
            EXCHANGE_CODE_FOR_TOKEN_SERVER_URL: null,
            TOKEN_SECRET: null,
            BASE_URL: "http://localhost:3000",
            SERVER_NAME: GIT_BRANCH ? `dm-manager [${GIT_BRANCH}]`: 'dm-manager',
            UPLOAD_DIRECTORY: __dirname + '/../uploads',
            WORKER_NOTIFICATION_INTERVAL: '60000',
        }
        Object.entries(options).forEach(([key, val]) => {
            this[key] = process.env[key] || val
        })
        this.VERSION = require('../package.json').version
        const parsedUrl = url.parse(this.MONGO_URI)

        this.MONGO_HOST = parsedUrl.hostname
        this.MONGO_PORT = parseInt(parsedUrl.port)
        const pathname = parsedUrl.pathname
        this.MONGO_DB = pathname.split('/')[1]
        this.API_PATH = '/api/v0'
    }
}

module.exports = new Options()
