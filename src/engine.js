function new_user(json) {
    let user = {
        roles: [],
        ...json
    }
    // inject functionality into user object:
    user.hasSomeRole = (...roles) => roles.some(role => user.roles.includes(role))
    return user
}

class Engine {
    constructor() {
        this.state = {
            counter: 0,
            messages: [],
            base_url: process.env.REACT_APP_SERVER_URL || "",
            config: null,
            user: null,
        }
        this.setState = null // need to call sync
    }

    sync(pair) {
        this.state = pair[0] 
        this.setState = pair[1]
    }

    click() { 
        this.setState( s => { 
            console.log(`click ${s.counter} -> ${s.counter+1}`)
            return {
                ...s, counter: s.counter+1
            }})
    }

    addMessage(message, type='error') {
        this.setState( s => ({
            ...s,
            messages: [...s.messages, [type, message]]
        }))
    }

    addErrorMessage(message) { this.addMessage(message, 'error')}
    addInfoMessage(message) { this.addMessage(message, 'info' )}
    addWarningMessage(message) { this.addMessage(message, 'warning' )}

    messages() {
        return this.state.messages
    }

    clearMessages() {
        this.setState( s => ({
            ...s,
            messages: []
        }))
    }

    async api_fetch(url, options) {
        options = {credentials: 'include', ...options}
        const response = await fetch(this.state.base_url + url, options)
        if (response.status === 401) throw new Error("invalid credentials")
        if (response.status === 400) {
            const data = await response.json()
            throw new Error(`Server error: ${data.error}`)
        }
        if (response.status !== 200) throw new Error("server error")
        const data = await response.json()
        return data
    }

    async post(url, data) {
        return await this.api_fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    }

    async put(url, data) {
        return await this.api_fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    }

    async patch(url, data) {
        console.log(`PATCH ${url} ${JSON.stringify(data)}`)
        return await this.api_fetch(url, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    }

    async get(url, data) {
        return await this.api_fetch(url + new URLSearchParams(data))
    }
    
    async delete(url) {
        return await this.api_fetch(url,
            {
                method: 'DELETE'
            })
    }

    async connect() {
        try {
            const config = await this.get('/config')
            this.setState(s => ({...s, config}))
            console.log(`config read: ${JSON.stringify(config)}`)
            return config
        } catch(err) {
            console.error(err)
            return null
        }
    }

    connected() { return this.state.config !== null }

    config() { return this.state.config }

    async login(username, password) {
        /**
         * if username and password are provided use credentials
         * otherwise check for existing session
         */
        const [url, payload] = username 
            ? ['/login/password', {username, password}]
            : ['/login', {}]
        console.log(`login POST: ${url}`)
        let { user } = await this.post(url, payload)
        console.log(`user: ${JSON.stringify(user)}`)
        if (user !== null) {
            user = new_user(user)
        }
        this.setState(s => ({...s, user}))
    }

    start_oauth2() {
        let url = this.state.base_url + '/login/oauth2'
        console.log(`start_oauth2: redirecting to ${url}`)
        window.location.href = url
    }

    async logout() {
        await this.post("/logout")
        this.setState(s => ({...s, user: null}))
        return true
    }

    loggedIn() { return this.state.user !== null }

    user() { return this.state.user }

    async impersonate_role(role) {
        let user = new_user(await this.post("/impersonate", { role }))
        this.setState(s => ({...s, user}))
    }

    async getVisits() {
        const { visits } = await this.get("/api/v0/visit/")
        return visits
    }

    async getVisit(id) {
        return await this.get(`/api/v0/visit/${id}`)
    }

    async putVisit(payload) {
        const r = await this.put("/api/v0/visit/", payload)
        return r
    }

    async patchVisit(id, payload) {
        const r = await this.patch(`/api/v0/visit/${id}`, payload)
        return r
    }

    async getUsers() {
        const { users } = await this.get("/api/v0/user/")
        return users
    }

    async getUser(id) {
        return await this.get(`/api/v0/user/${id}`)
    }

    async putUser(payload) {
        const r = await this.put("/api/v0/user/", payload)
        return r
    }

    async patchUser(id, payload) {
        const r = await this.patch(`/api/v0/user/${id}`, payload)
        return r
    }

    async deleteUser(user) {
        await this.delete(`/api/v0/user/${user._id}`)
    }


    async getTokens() {
        const { tokens } = await this.get("/api/v0/token/")
        return tokens
    }

    async putToken(payload) {
        const { token } = await this.put("/api/v0/token/", payload)
        console.log(`putToken: ${JSON.stringify(token)}`)
        return token
    }

    async deleteToken(token) {
        await this.delete(`/api/v0/token/${token._id}`)
    }
}

const engine = new Engine()

export default engine
