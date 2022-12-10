import Model from './Model'

export default class RoomAssignment extends Model {
    constructor() {
        super()
        this.code = 'roomAssignment'
        this.name = "assegnazione stanza"
        this.oa = "a"
        this.articulation = {
            'oggetto': "assegnazione stanza", 
            'oggetti': "assegnazioni stanze",
            'l\'oggetto': "l'assegnazione stanza",
            'gli oggetti': "le assegnazioni stanze", 
            'un oggetto': "una assegnazione stanza", 
        }
        this.ModelName = 'RoomAssignment'
        this.indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
        this.managerRoles = ['admin', 'assignment-manager'] 
        this.columns = {
            'startDate': "dal",
            'endDate': "al",
            'person': "persona",
            'room': "stanza",
            'updatedAt': "modificato",
        }
    }

    describe(obj) {
        return `${obj.person?.lastName} ${obj.room?.number} ${obj.room?.building} ${obj.room?.floor}`
    }
}
