// Renders the real widgets (widgets/src) against the contract server: the
// widget builds its own requests from shortcode attributes, axios calls go
// to the in-memory application, and the widget is rendered with the actual
// responses. A missing field the widget reads makes the render throw.
//
// Requires the widget dependencies (npm --prefix widgets ci), like the other
// widget tests.

const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')

const WIDGETS = path.resolve(__dirname, '../../../widgets')
const widgetRequire = createRequire(path.join(WIDGETS, 'package.json'))
const { transformSync } = widgetRequire('esbuild')
const React = widgetRequire('react')
const { renderToStaticMarkup } = widgetRequire('react-dom/server')

const ORIGIN = 'https://www.dm.unipi.it'

// axios serialization of params: skip null/undefined, dates as ISO strings.
function withParams(url, params = {}) {
    const [pathname, query = ''] = url.split('?')
    const search = new URLSearchParams(query)
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue
        search.append(key, value instanceof Date ? value.toISOString() : String(value))
    }
    const text = search.toString()
    return text ? `${pathname}?${text}` : pathname
}

function createWidgetHarness(api) {
    let current = null // the render in progress: { queries, requests }
    let mounted = null

    const reactQuery = {
        useQuery(key, fn) {
            const id = JSON.stringify(key)
            if (!current.queries.has(id)) {
                current.queries.set(id, { fn, done: false, result: { isLoading: true, data: undefined, error: null } })
            }
            return current.queries.get(id).result
        },
        QueryClient: class {},
        QueryClientProvider: ({ children }) => children,
    }

    const axios = {
        async get(url, config = {}) {
            const target = withParams(url, config.params)
            const res = await api.request('GET', target, { headers: { Origin: ORIGIN } })
            current.requests.push({ url: target, status: res.status, cors: res.headers.get('access-control-allow-origin') })
            if (res.status >= 400) {
                const error = new Error(`GET ${target} -> ${res.status} ${res.text.slice(0, 200)}`)
                error.response = { status: res.status, data: res.body }
                throw error
            }
            return { status: res.status, data: res.body }
        },
    }

    const context = {
        document: { documentElement: { lang: 'it-IT' }, cookie: '' },
        window: { location: { href: `${ORIGIN}/`, search: '', pathname: '/' } },
        URLSearchParams,
        dmwidgets: { localDevelopment: true }, // relative /api/v0 URLs
        console: { log() {}, warn() {}, error() {} },
    }

    const loaded = new Map()
    function load(file) {
        if (loaded.has(file)) return loaded.get(file)
        const module = { exports: {} }
        loaded.set(file, module.exports)
        const code = transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code
        vm.runInNewContext(code, {
            ...context,
            module,
            exports: module.exports,
            require(name) {
                if (name.endsWith('.css')) return {}
                if (name === 'react') return React
                if (name === 'react-query') return reactQuery
                if (name === 'axios') return axios
                if (name === 'react-dom/client') {
                    return { createRoot: () => ({ render(element) { mounted = element.props.children } }) }
                }
                if (name.startsWith('.')) {
                    const resolved = path.resolve(path.dirname(file), name)
                    return load(fs.existsSync(resolved) ? resolved : `${resolved}.js`)
                }
                return widgetRequire(name)
            },
        }, { filename: file })
        loaded.set(file, module.exports)
        return module.exports
    }

    const { dmwidgets } = load(path.join(WIDGETS, 'src/index.js'))

    // props: the shortcode attributes (merged with the page query string),
    // as [dm_manager_widget widget="Name" ...] passes them.
    async function render(name, props = {}) {
        current = { queries: new Map(), requests: [], errors: [] }
        mounted = null
        dmwidgets.loadComponent({}, name, { widget: name, ...props })
        if (!mounted) throw new Error(`widget ${name} was not mounted`)
        for (let round = 0; round < 6; round++) {
            const html = renderToStaticMarkup(mounted)
            const pending = [...current.queries.values()].filter(query => !query.done)
            if (!pending.length) return { html, requests: current.requests, errors: current.errors }
            for (const query of pending) {
                try {
                    query.result = { isLoading: false, isSuccess: true, data: await query.fn(), error: null }
                } catch (error) {
                    query.result = { isLoading: false, isError: true, data: undefined, error }
                    current.errors.push(error)
                }
                query.done = true
            }
        }
        throw new Error(`widget ${name} kept issuing new queries`)
    }

    return { render }
}

module.exports = { createWidgetHarness }
