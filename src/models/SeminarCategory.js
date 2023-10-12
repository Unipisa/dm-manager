import Model from './Model'

export default class SeminarCategory extends Model {
    constructor() {
        super()
        this.code = 'seminar-category'
        this.name = "cicli di seminari"
        this.oa = "o"
        this.articulation = {
            'oggetto': "cicli di seminario", 
            'oggetti': "cicli di seminari",
            'l\'oggetto': "il ciclo di seminario",
            'gli oggetti': "i cicli di seminari", 
            'un oggetto': "un ciclo di seminari", 
        }
        this.ModelName = 'SeminarCategory'
        this.ModelCategory = 'eventi'
        this.managerRoles = ['admin', 'seminar-category-manager']
        this.columns = {
            'name': 'Nome',
            'label': 'Label',
        }

        this.indexDefaultFilter = {'_sort': 'name', '_limit': 50}
    }

    describe(seminarCategory) { 
        return `${seminarCategory.name}`
    }
}

