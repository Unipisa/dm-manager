import Model from './Model'

export default class Grant extends Model {
    constructor() {
        super()
        this.code = 'grant'
        this.name = "grant"
        this.names = "grants"
        this.ModelName = 'Grant'
        this.ModelCategory = 'ricerca'
        this.oa = 'o'
        this.articulation = {
            'oggetto': "grant", 
            'oggetti': "grants",
            'l\'oggetto': "il grant",
            'gli oggetti': "i grants", 
            'un oggetto': "un grant", 
        }
        this.indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
        this.managerRoles = ['admin', 'grant-manager']
        this.columns = {
            'startDate': "dal",
            'endDate': "al",
            'name': "nome",
            'identifier': "id",
            'projectType': "tipo",
            'pi': "pi",
            'updatedAt': "modificato",
        }
    }

    describe(grant) { return grant?.name }
}



