const BASE_URL = process.env.REACT_APP_SERVER_URL || ""

async function api_fetch(url, options) {
    const options_json = options ? `- ${JSON.stringify(options)}` : ''
    console.log(`API_FETCH ${url} ${options_json}`)
    options = {credentials: 'include', ...options}
    const response = await fetch(BASE_URL + url, options)
    if (response.status === 401) throw new Error("invalid credentials")
    if (response.status === 400) {
        const data = await response.json()
        throw new Error(`Bad request: ${data.error}`)
    }
    if (response.status === 403) {
        const data = await response.json()
        throw new Error(`Not authorized: ${data.error}`)
    }
    if (response.status === 404) {
        const data = await response.json()
        throw new Error(`Not found: ${data.error}`)
    }
    if (response.status !== 200) throw new Error("server error")
    const data = await response.json()
    return data
}

async function post(url, data) {
    return api_fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
}

async function put(url, data) {
    return api_fetch(url, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })}

async function patch(url, data) {
    return api_fetch(url, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })}

async function get(url, data) {
    return api_fetch(url + '?' + new URLSearchParams(data))
}

// delete is a reserved word
async function del(url) {
    return api_fetch(url, {method: 'DELETE'})
}

const api = {
    BASE_URL,
    api_fetch,
    get,
    post,
    put,
    patch,
    del,
}

export default api
