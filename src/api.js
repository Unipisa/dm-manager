export default class Api {
    constructor(url) {
        this.base_url = url || "http://localhost:8000"
        this.config = null
        this.user = null
    }

    async fetch(url, options) {
        options = {credentials: 'include', ...options}
        const response = await fetch(this.base_url + url, options)
        if (response.status === 401) throw new Error("invalid credentials")
        if (response.status !== 200) throw new Error("server error")
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
        console.log(`login POST: /login/password`)
        this.user = await this.post('/login/password', {username, password})
        console.log(`user logged: ${JSON.stringify(this.user)}`)
        return this.user
    }

    start_oauth2() {
        let url = this.base_url + '/login/oauth2'
        console.log(`start_oauth2: redirecting to ${url}`)
        window.location.href = url
    }
}
