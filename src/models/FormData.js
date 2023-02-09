import Model from './Model'

export default class FormData extends Model {
    constructor() {
        super()
        this.code = 'invalid-code'
        this.name = "dati modulo"
        this.oa = "o"
        this.articulation = {
            'oggetto': "dato", 
            'oggetti': "dati",
            'l\'oggetto': "il dato",
            'gli oggetti': "i dati", 
            'un oggetto': "un dato", 
        }
        this.ModelName = 'FormData'
        this.indexDefaultFilter = {'_sort': 'updatedAt', '_limit': 10}
        this.managerRoles = ['admin','form-manager']
        this.columns = {
            'name': 'nome',
            'updatedAt': "modificato",
        }
        this.ViewPage = null
        this.EditPage = null
        this.IndexPage = null
        this.HomeElement = null
        this.MenuElement = null
    }

    describe(formdata) { 
        return `<formdata>` 
    }

    routers() {
        return []
    }
}

