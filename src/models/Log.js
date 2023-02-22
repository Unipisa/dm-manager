import Model from './Model'

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
        this.ModelCategory = 'amministrazione'
        this.columns = {
            'when': "quando",
            'who': "chi",
            'where': "dove",
            'what': "cosa",
//            'was': "era",
            'will': "info"
        }
        this.indexDefaultFilter = {_limit: 10, _sort: '-when'}
    }

    describe(obj) { return `<log>` }
}

