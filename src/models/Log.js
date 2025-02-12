import Model from './Model'

import LogViewPage from '../pages/LogViewPage'

export default class Log extends Model {
    constructor() {
        super()
        this.code = 'log'
        this.name = "log"
        this.oa = "o"
        this.articulation = {
            'oggetto': "log",
            'oggetti': "log",
            'l\'oggetto': "il log",
            'gli oggetti': "i log",
            'un oggetto': "una log",
        }
        this.ModelName = 'Log' 
        this.columns = {
            'when': "quando",
            'who': "chi",
            'where': {label: "dove", render: obj => obj.where.replace('/api/v0/process/','⠶').replace('/api/v0/','⠊')},
            'what': "cosa",
            'will': {label: "info", render: obj => JSON.stringify(obj.will||obj.was)},
        }
        this.indexDefaultFilter = {_limit: 10, _sort: '-when'}
        this.ViewPage = LogViewPage
    }

    describe(obj) { return `<log>` }
}

