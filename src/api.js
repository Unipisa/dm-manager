export default class Api {
    constructor() {
        this.config = null
        this.user = null
    }

    async fetch(url, options) {
        const response = await fetch(url, options)
        if (response.status === 401) throw "invalid credentials"
        if (response.status !== 200) throw "server error"
        const data = await response.json()
        return data
    }

    async post(url, data) {
        return await this.fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    }

    async get(url, data) {
        return await this.fetch(url + new URLSearchParams(data))
    }

    async getConfig() {
        this.config = await this.get('/config')
        console.log(`config read: ${JSON.stringify(this.config)}`)
        return this.config
    }

    async login(username, password) {
        this.user = await this.post('/login/password', {username, password})
        console.log(`user logged: ${JSON.stringify(this.user)}`)
        return this.user
    }
}
