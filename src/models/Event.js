import Model from './Model'

export default class Event extends Model {
    constructor() {
        super()
        this.code = 'event'
        this.name = "evento"
        this.oa = "o"
        this.articulation = {
            'oggetto': "evento", 
            'oggetti': "eventi",
            'l\'oggetto': "l'evento",
            'gli oggetti': "gli eventi", 
            'un oggetto': "un evento", 
        }
        this.ModelName = 'Event' 
        this.ModelCategory = 'ricerca'
        this.columns = {
            'title': "persona",
            'startDate': "dal",
            'endDate': "al",
            'updatedAt': "modificato",
        }
    }

    describe(obj) { return `${obj?.title}` }   
}

