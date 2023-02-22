import Model from './Model'

export default class Thesis extends Model {
    constructor() {
        super()
        this.code = 'thesis'
        this.name = "tesi"
        this.names = "tesi"
        this.ModelName = 'Thesis'
        this.ModelCategory = 'ricerca'
        this.oa = 'a'
        this.articulation = {
            'oggetto': "tesi", 
            'oggetti': "tesi",
            'l\'oggetto': "la tesi",
            'gli oggetti': "le tesi", 
            'un oggetto': "una tesi", 
        }
        this.indexDefaultFilter = {'_sort': '-date', '_limit': 10}
        this.managerRoles = ['admin', 'thesis-manager']
        this.columns = {
            'date': "data",
            'person': "persona",
            'SSD': "SSD",
            'updatedAt': "modificato",
        }
    }

    describe(thesis) { return thesis?.person.lastName }
}



