import moment from 'moment'
import { useState, createContext, useContext } from 'react'
import { useQuery, useQueryClient, useMutation } from 'react-query'
import { useLocationState } from 'react-router-use-location-state'

import api from './api'
import Models from './models/Models'

function new_user(json) {
    let user = {
        roles: [],
        ...json
    }

    // inject functionality into user object:

    user.hasSomeRole = (...roles) => {
        if (roles.includes('@any-logged-user')) return true
        return roles.some(role => user.roles.includes(role))
    }

    /**
     * 
     * @param {*} process 
     * @returns true if user has the admin role or has a role 
     * which is process or a subpath of process
     */
    user.hasProcessPermission = (process) => {
        // console.log(`hasProcessPermission(${process}) roles:${user.roles.join(',')})}`)
        process = process.split('/')
        return user.roles.some(role => {
            if (role === 'admin') return true
            role = role.split('/')
            return !process.some((part, i) => part !== role[i])
        })
    }

    return user
}

export const EngineContext = createContext('dm-manager')

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
        Models: null
    })

    const queryClient = useQueryClient()

    const addMessage = (message, type='error') => {
        setState( s => ({
            ...s,
            messages: [...s.messages, [type, message]]
        }))
    }

    // questo oggetto è l'engine creato in App.js
    // e reso disponibile in ogni componente
    // grazie al context
    return {
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
                const config = await api.get('/config')
                let { user, person, roles, staffs} = await api.post('/login')

                if (user != null) {
                    user.roles = roles
                    user.person = person
                    user.staffs = staffs
                    user = new_user(user)
                }

                const ServerModels = (await api.get('/api/v0/Models'))

                Object.values(Models).forEach(Model => {
                    Model.schema = ServerModels[Model.ModelName]    
                })

                setState(s => ({...s, config, user, Models}))

                return config
            } catch(err) {
                console.error(err)
                return null
            }
        },

        connected: state.config !== null,

        config: state.config,

        Models: state.Models,

        login: async (username, password) => {
            /**
             * if username and password are provided use credentials
             * otherwise check for existing session
             */
            let { user } = await api.post('/login/password', {username, password})
            // console.log(`user: ${JSON.stringify(user)}`)
            if (user !== null) {
                user = new_user(user)
            }

            setState(s => ({...s, user}))
        },

        start_oauth2: async () => {
            // let url = api.BASE_URL + '/login/oauth2' // ?next=' + window.location.href
            let url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/login/oauth2?next=${window.location.href}`
            console.log(`start_oauth2: redirecting to ${url}`)
            // sessionStorage.setItem('redirect_after_login', window.location.pathname)
            window.location.href = url
        },

        logout: async () => {
            await api.post("/logout")
            setState(s => ({...s, user: null}))
            return true
        },

        loggedIn: state.user !== null,

        user: state.user,

        impersonate_role: async (role) => {
            let user = new_user(await api.post("/impersonate", { role }))
            setState(s => ({...s, user}))
        },

        useIndex: (path, filter={}) => {
            filter = Object.fromEntries(Object.entries(filter).map(
                ([key, val]) => {
                    if (val instanceof Date) val = val.toISOString()
                    return [key, val]
                }
            )) 
            const query = useQuery([path, filter], 
                () => api.get(`/api/v0/${path}`, filter), {
                    keepPreviousData: true,
                    onError: (err) => addMessage(err.message, 'error'),
                })
            return query
        },

        useGet: (path, id) => {
            const pathArray = id === undefined ? [path] : [path, id]
            const url = id === undefined ? `/api/v0/${path}` : `/api/v0/${path}/${id}`
            return useQuery(
                pathArray, 
                () => api.get(url), 
                {
                    enabled: id !== null,
                    onError: (err) => addMessage(err.message, 'error'),
                })
        },

        usePut: (path) => {
            const mutation = useMutation(payload => api.put(`/api/v0/${path}/`, payload), {
                onSuccess: () => {
                    queryClient.invalidateQueries([path])
                }
            })
            return async (object) => {
                try {
                    const res = await mutation.mutateAsync(object)
                    return res 
                } catch(err) {
                    addMessage(err.message, 'error')
                    throw err
                }
            }
        },

        usePatch: (path) => {
            const mutation = useMutation(
                payload => {
                    let url = `/api/v0/${path}`
                    if (payload._id) url += `/${payload._id}`
                    return api.patch(url, payload)
                }, {
                    onSuccess: () => {
                        queryClient.invalidateQueries([path])
                    }
                })
            return async (payload) => {
                try {
                    const res = await mutation.mutateAsync(payload)
                    // await queryClient.invalidateQueries([path])
                    return res
                } catch(err) {
                    addMessage(err.message, 'error')
                    throw err
                }
            }
        },

        useDelete: (path) => { 
            const mutation = useMutation(async (object) => api.del(`/api/v0/${path}/${object._id}`),{
                onSuccess: () => {
                    queryClient.invalidateQueries([path])
                    /**
                     * sembra che l'invalidazione 
                     * causi una richiesta all'oggetto
                     * e quindi, giustamente, un errore 404 
                     * sulla console
                     */
                }
            })
            return async (object) => {
                try {
                    const res = await mutation.mutateAsync(object)
                    return res
                } catch(err) {
                    addMessage(err.message, 'error')
                    throw err
                }
            }
        },

        useGetRelated: (modelName, _id) => {
            const related = state.Models[modelName].schema.related
            const path = 'getRelated/' + modelName + '/' + _id
            return useQuery(path, async () => {
                const data = []
                for (const info of related) {
                    const url = `/api/v0/${info.url}`
                    const result = await api.get(url, {[info.field]: _id})
                    data.push({
                        ...info,
                        data: result.data 
                    })
                }

                return data
            })
        }
    }
}

export function useQueryFilter(initial) {
    const [filter, setFilter] = useLocationState('filter', initial)
    
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

    function extendLimit() {
        setFilter(filter => ({
            ...filter,
            _limit: 10* filter._limit
        }))
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
        extendLimit,
    }
}

export const minDate = new Date(-8640000000000000)
export const maxDate = new Date(8640000000000000)

export function myDateFormat(date) {
    if (date === undefined) return '???'
    if (date === null) return '---'
    date = moment(date)
    if (date < minDate) return '---'
    if (date > maxDate) return '---'
    return moment(date).format('D.M.YYYY')
}

export function myDatetimeFormat(date) {
    if (date === undefined) return '???'
    if (date === null) return '---'
    date = moment(date)
    if (date < minDate) return '---'
    if (date > maxDate) return '---'
    return moment(date).format('D.M.YYYY, H:mm')
}


export function notNullStartDate(date) {
    if (date === null) return minDate
    if (typeof date === 'string') return new Date(date)
    return date
}

export function notNullEndDate(date) {
    if (date === null) return maxDate
    if (typeof date === 'string') return new Date(date)
    return date
}

export function setter(setData, key) {
    return (value) => {
        setData(data => ({ ...data, [key]: value }))
    }
}
