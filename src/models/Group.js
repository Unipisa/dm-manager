import Model from './Model'

export default class Group extends Model {
    constructor() {
        super()
        this.code = 'group'
        this.name = "gruppo"
        this.oa = "o"
        this.articulation = {
            'oggetto': "gruppo", 
            'oggetti': "gruppi",
            'l\'oggetto': "il gruppo",
            'gli oggetti': "i gruppi", 
            'un oggetto': "un gruppo", 
        }
        this.ModelName = 'Group' 
        this.ModelCategory = 'personale'
        this.columns = {
            'name': "nome",
            'startDate': "dal",
            'endDate': "al",
            'members': "membri",
            'updatedAt': "modificato",
        }
    }

    describe(obj) { return `${obj?.name}` }
}

