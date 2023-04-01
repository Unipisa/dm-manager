import Model from './Model'

export default class Institution extends Model {
    constructor() {
        super()
        this.code = 'institution'
        this.name = "istituzione"
        this.oa = "a"
        this.articulation = {
            'oggetto': "istituzione", 
            'oggetti': "istituzioni",
            'l\'oggetto': "l'istituzione",
            'gli oggetti': "le istituzioni", 
            'un oggetto': "un'istituzione",
        }
        this.ModelName = 'Institution'
        this.ModelCategory = 'ricerca'
        this.managerRoles = ['admin', 'institution-manager']
        this.indexDefaultFilter = {'_sort': 'name', '_limit': 10}
        this.columns = {
            'name': "nome",
            'country': "paese",
            'city': "città",
            'updatedAt': "modificato",
        }
    }

    describe(obj) { return `${obj.name}` }
}
