import moment, { max } from 'moment'
import { useState, createContext, useContext, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from 'react-query'

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
                let { user } = await api.post('/login')

                if (user != null) {
                    user = new_user(user);
                }

                const ServerModels = (await api.get('/api/v0/Models'))

                Object.values(Models).forEach(Model => {
                    Model.schema = ServerModels[Model.ModelName]    
                })

                setState(s => ({...s, config, user, Models}))

                console.log(`config read: ${JSON.stringify(config)}`)
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
            let url = api.BASE_URL + '/login/oauth2'
            console.log(`start_oauth2: redirecting to ${url}`)
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
            const query = useQuery(
                [path, id], 
                () => api.get(`/api/v0/${path}/${id}`), 
                {
                    enabled: id !== 'new',
                    onError: (err) => addMessage(err.message, 'error'),
                })
            return query
        },

        usePut: (path, cb) => {
            const mutation = useMutation(payload => api.put(`/api/v0/${path}/`, payload))
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
            const mutation = useMutation(payload => api.patch(`/api/v0/${path}/${payload._id}`, payload))
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
            const mutation = useMutation(async (object) => api.del(`/api/v0/${path}/${object._id}`))
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

        useGetRelated: (modelName, _id) => {
            const related = state.Models[modelName].schema.related
            const [data, setData] = useState(related.map(
                info => ({...info, data: null})))
            useEffect(() => {
                related.forEach((info, i) => {
                    api.get(`/api/v0/${info.url}`, {[info.field]: _id}).then(result => {
                        setData(data => data.map(
                            (old, i_) => {
                                if (i !== i_) return old
                                return {
                                    ...info, 
                                    data: result.data
                                }
                            }
                        ))
                    })
                })
            }, [_id, related])
            return data
        }
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

    function extendLimit() {
        setFilter(filter => ({
            ...filter,
            _limit: 2* filter._limit
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

