import Model from './Model'

export default class Person extends Model {
    constructor() {
        super()
        this.code = 'person'
        this.name = "persona"
        this.oa = "a"
        this.articulation = {
            'oggetto': "persona", 
            'oggetti': "anagrafica",
            'l\'oggetto': "la persona",
            'gli oggetti': "le persone", 
            'un oggetto': "una persona", 
        }
        this.ModelName = 'Person'
        this.ModelCategory = 'personale'
        this.managerRoles = ['admin', 'person-manager']
        this.indexDefaultFilter = {'_sort': 'lastName', '_limit': 10}
        this.columns = {
            'lastName': "cognome",
            'firstName': "nome",
            'affiliation': "affiliazione",
            'email': "email",
            'updatedAt': "modificato",
        }
    }

    describe(obj) { return `${obj?.firstName} ${obj?.lastName}` }
}
