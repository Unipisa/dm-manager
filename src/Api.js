import { useState } from 'react'

let common_state = {
    base_url: "http://localhost:8000",
    config: null,
    user: null,
}

class Api {
    constructor(state, setState) {
        this.state = state
        this.setState = setState
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

    async getVisits() {
        const {visits} = await this.get("/api/v0/visit/")
        return visits
    }

    async getVisit(id) {
        return await this.get(`/api/v0/visit/${id}`)
    }

    async putVisit(payload) {
        const r = await this.put("/api/v0/visit/", payload)
        return r
    }
}

export default function useApi(initial_state) {
    return new Api(...useState(initial_state || common_state))
}