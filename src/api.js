let common_state = {
    base_url: "http://localhost:8000",
    config: null,
    user: null,
    token: null,
}

export function getApi(state) {
    state = state || common_state

    function init(base_url) { state.base_url = base_url }

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

    async function get(url, data) {
        return await api_fetch(url + new URLSearchParams(data))
    }

    async function connect() {
        try {
            state.config = await get('/config')
            console.log(`config read: ${JSON.stringify(state.config)}`)
            return state.config
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
        const { user, token } = await post(url, payload)
        console.log(`user: ${JSON.stringify(user)}, token; ${token}`)
        state.user = user 
        state.token = token
    }

    function start_oauth2() {
        let url = state.base_url + '/login/oauth2'
        console.log(`start_oauth2: redirecting to ${url}`)
        window.location.href = url
    }

    async function logout() {
        await post("/logout")
        state.user = null
        return true
    }

    function loggedIn() { return state.user !== null }

    function user() { return state.user }

    function sync() { return getApi(state) }

    return { 
        init, sync, get, post, connect, connected, 
        login, loggedIn, user, logout, start_oauth2,
        _state: state
    }

}
