import { useState } from 'react'

let common_state = {
    base_url: "http://localhost:8000",
    config: null,
    user: null,
    counter: 0,
    messages: []
}

class Engine {
    constructor(state, setState) {
        this.state = state
        this.setState = setState
    }
    
    init(base_url) {
        this.setState(s => ({...s, base_url })) 
    }

    async api_fetch(url, options) {
        options = {credentials: 'include', ...options}
        const response = await fetch(this.state.base_url + url, options)
        if (response.status === 401) throw new Error("invalid credentials")
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

    async get(url, data) {
        return await this.api_fetch(url + new URLSearchParams(data))
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

    async login(username, password) {
        /**
         * if username and password are provided use credentials
         * otherwise check for existing session
         */
        const [url, payload] = username 
            ? ['/login/password', {username, password}]
            : ['/login', {}]
        console.log(`login POST: ${url}`)
        const { user } = await this.post(url, payload)
        console.log(`user: ${JSON.stringify(user)}`)
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

    async getVisits() {
        try {
            const {visits} = await this.get("/api/v0/visit/")
            return visits
        } catch(err) {
            this.addErrorMessage(err.message)
            return null
        }
    }

    async putVisit(payload) {
        try {
            const r = await this.put("/api/v0/visit/", payload)
            return r
        } catch(err) {
            this.addErrorMessage(err.message)
            return null
        }
    }
}

export default function useEngine(initial_state) {
    return new Engine(...useState(initial_state || common_state))
}