import { useState } from 'react'

let common_state = {
    base_url: "http://localhost:8000",
    config: null,
    user: null,
    counter: 0,
    messages: []
}

export function useApi(initial_state) {
    const [state, setState_] = useState(initial_state || common_state)
    
    console.log(`initial state ${JSON.stringify(state)}`)

    function setState(f) {
        console.log(`setState ${JSON.stringify(state)} -> ${JSON.stringify(f(state))}`)
        setState_(f)
    }

    function init(base_url) {
        setState(s => ({...s, base_url })) 
    }

    async function api_fetch(url, options) {
        options = {credentials: 'include', ...options}
        const response = await fetch(state.base_url + url, options)
        if (response.status === 401) throw new Error("invalid credentials")
        if (response.status !== 200) throw new Error("server error")
        const data = await response.json()
        return data
    }

    async function post(url, data) {
        return await api_fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    }

    async function put(url, data) {
        return await api_fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    }

    async function get(url, data) {
        return await api_fetch(url + new URLSearchParams(data))
    }

    async function connect() {
        try {
            const config = await get('/config')
            setState(s => ({...s, config}))
            console.log(`config read: ${JSON.stringify(config)}`)
            return config
        } catch(err) {
            console.error(err)
            return null
        }
    }

    function connected() { return state.config !== null }

    async function login(username, password) {
        /**
         * if username and password are provided use credentials
         * otherwise check for existing session
         */
        const [url, payload] = username 
            ? ['/login/password', {username, password}]
            : ['/login', {}]
        console.log(`login POST: ${url}`)
        const { user } = await post(url, payload)
        console.log(`user: ${JSON.stringify(user)}`)
        setState(s => ({...s, user}))
    }

    function start_oauth2() {
        let url = state.base_url + '/login/oauth2'
        console.log(`start_oauth2: redirecting to ${url}`)
        window.location.href = url
    }

    async function logout() {
        await post("/logout")
        setState(s => ({...s, user}))
        return true
    }

    function loggedIn() { return state.user !== null }

    function user() { return state.user }

    function click() { 
        setState( s => { 
            console.log(`click ${s.counter} -> ${s.counter+1}`)
            return {
                ...s, counter: s.counter+1
            }})
    }

    function addMessage(message, type='error') {
        setState( s => ({
            ...s,
            messages: [...s.messages, [type, message]]
        }))
    }

    function messages() {
        return state.messages
    }

    function clearMessages() {
        setState( s => ({
            ...s,
            messages: []
        }))
    }

    async function putVisit(payload) {
        try {
            const r = await put("/api/v0/visit/", payload)
            return r
        } catch(err) {
            addMessage(err.message, 'error')
            return null
        }
    }

    return { 
        init, get, post, connect, connected, 
        login, loggedIn, user, logout, start_oauth2,
        click,
        addMessage, messages, clearMessages,
        putVisit,
        _state: state
    }
}
