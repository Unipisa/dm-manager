import moment from 'moment'
import { useState, createContext, useContext } from 'react'
import { useQuery, useQueryClient, useMutation } from 'react-query'

export const EngineContext = createContext(null)

export const EngineProvider = EngineContext.Provider
  
export function useEngine() {
    return useContext(EngineContext)
}

export function useCreateEngine() {
    const [state, setState] = useState({
        counter: 0,
        messages: [],
        base_url: process.env.REACT_APP_SERVER_URL || "",
        config: null,
        user: null,
    })

    const queryClient = useQueryClient()

    function new_user(json) {
        let user = {
            roles: [],
            ...json
        }
        // inject functionality into user object:
        user.hasSomeRole = (...roles) => roles.some(role => user.roles.includes(role))
        return user
    }
    
    const addMessage = (message, type='error') => {
        setState( s => ({
            ...s,
            messages: [...s.messages, [type, message]]
        }))
    }

    const api_fetch = async (url, options) => {
        options = {credentials: 'include', ...options}
        const response = await fetch(state.base_url + url, options)
        if (response.status === 401) throw new Error("invalid credentials")
        if (response.status === 400) {
            const data = await response.json()
            throw new Error(`Server error: ${data.error}`)
        }
        if (response.status !== 200) throw new Error("server error")
        const data = await response.json()
        return data
    }

    const post = async (url, data) => api_fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

    const put = async (url, data) => api_fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

    const patch = async (url, data) => api_fetch(url, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

    const get = async (url, data) => api_fetch(url + '?' + new URLSearchParams(data))
    
    // delete is a reserved word
    const del = async (url) => api_fetch(url, {method: 'DELETE'})

    // questo oggetto è l'engine creato in App.js
    // e reso disponibile in ogni componente
    // grazie al context
    return {
        click: () => { 
            setState( s => { 
                console.log(`click ${s.counter} -> ${s.counter+1}`)
                return {
                    ...s, counter: s.counter+1
                }})
        },

        addMessage,

        addErrorMessage: (message) => addMessage(message, 'error'),
        
        addInfoMessage: (message) => addMessage(message, 'info'),

        addWarningMessage: (message) => addMessage(message, 'warning'),

        messages: state.messages,

        clearMessages: () => {
            setState( s => ({
                ...s,
                messages: []}))},

        connect: async () => {
            try {
                const config = await get('/config')
                let { user } = await post('/login');

                if (user != null) {
                    user = new_user(user);
                }

                setState(s => ({...s, config, user}))

                console.log(`config read: ${JSON.stringify(config)}`)
                return config
            } catch(err) {
                console.error(err)
                return null
            }
        },

        connected: state.config !== null,

        config: state.config,

        login: async (username, password) => {
            /**
             * if username and password are provided use credentials
             * otherwise check for existing session
             */
            let { user } = await post('/login/password', {username, password})
            // console.log(`user: ${JSON.stringify(user)}`)
            if (user !== null) {
                user = new_user(user)
            }
            setState(s => ({...s, user}))
        },

        start_oauth2: async () => {
            let url = state.base_url + '/login/oauth2'
            console.log(`start_oauth2: redirecting to ${url}`)
            window.location.href = url
        },

        logout: async () => {
            await post("/logout")
            setState(s => ({...s, user: null}))
            return true
        },

        loggedIn: state.user !== null,

        user: state.user,

        impersonate_role: async (role) => {
            let user = new_user(await post("/impersonate", { role }))
            setState(s => ({...s, user}))
        },

        useIndex: (path, filter={}) => {
            console.assert(['visit','token','user','roomLabel'].includes(path), `invalid path ${path}`)
            const query = useQuery([path, filter], () => get(`/api/v0/${path}`, filter), {
                onError: (err) => { 
                    addMessage(err.message, 'error') },
                })
            return query
        },

        useGet: (path,id) => {
            console.assert(['visit', 'user'].includes(path), `invalid path ${path}`)
            const query = useQuery([path, id], () => get(`/api/v0/${path}/${id}`))
            return query
        },

        usePut: (path, cb) => {
            const mutation = useMutation(payload => put(`/api/v0/${path}/`, payload))
            return async (object) => {
                mutation.mutate(object, {
                    onSuccess: (result) => {
                        queryClient.invalidateQueries([path])
                        if (cb) cb(result)
                    },
                    onError: (err) => {
                        addMessage(err.message, 'error')
                    }
                })
            }
        },

        usePatch: (path, cb) => {
            const mutation = useMutation(payload => patch(`/api/v0/${path}/${payload._id}`, payload))
            return async (object) => {
                mutation.mutate(object, {
                    onSuccess: (result, object) => {
                        queryClient.invalidateQueries([path])
                        if (cb) cb(result, object)
                    },
                    onError: (err) => {
                        addMessage(err.message, 'error')
                    }
                })
            }
        },

        useDelete: (path, cb) => { 
            const mutation = useMutation(async (object) => del(`/api/v0/${path}/${object._id}`))
            return async (object) => {
                mutation.mutate(object, {
                    onSuccess: (result, object) => {
                        queryClient.invalidateQueries([path])
                        if (cb) cb(result, object)
                    },
                    onError: (err) => {
                        addMessage(err.message, 'error')
                    }
                })
            }
        },
    }
}

export function useQueryFilter(initial) {
    const [filter, setFilter] = useState(initial)
    
    function sortIcon(field) {
        const sort = filter._sort
        if (sort) {
            if (sort === field || sort === `+${field}`) return '↓'
            if (sort === `-${field}`) return '↑'
        }
        return ''
    }

    function onClick(field) {
        const sort = filter._sort
        if (sort === field || sort === `+${field}`) {
            setFilter(filter => ({
                ...filter,
                _sort: `-${field}`
            }))
        } else {
            setFilter(filter => ({
                ...filter,
                _sort: field
            }))
        }
    }

    return {
        filter,
        setFilter,
        header: (field) => ({
            sortIcon: sortIcon(field),
            onClick: () => onClick(field),
            }),
        sortIcon,
        onClick,
    }
}

export function myDateFormat(date) {
    return date ? moment(date).format('D.MM.YYYY') : "---"
}

