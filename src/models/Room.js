import Model from './Model'

export default class Room extends Model {
    constructor() {
        super()
        this.code = 'room'
        this.name = "stanza"
        this.oa = "a"
        this.articulation = {
            'oggetto': "stanza", 
            'oggetti': "stanze",
            'l\'oggetto': "la stanza",
            'gli oggetti': "le stanze", 
            'un oggetto': "una stanza", 
        }
        this.ModelName = 'Room'
        this.indexDefaultFilter = {'_sort': 'number', '_limit': 10}
        this.managerRoles = ['admin','room-manager']
        this.columns = {
            'number': "numero",
            'floor': "piano",
            'building': "edificio",
            'updatedAt': "modificato",
            'notes': "note",
        }
    }

    describe(room) { return `${room.number} ${room.floor} ${room.building}` }
}

