import Model from './Model'
import RoomViewPage from '../pages/RoomViewPage'

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
        this.indexDefaultFilter = {'_sort': 'code', '_limit': 10}
        this.managerRoles = ['admin','room-manager']
        this.columns = {
            'code': 'codice',
            'number': "numero",
            'floor': "piano",
            'building': "edificio",
            'nSeats': "posti",
            'notes': "note",
            'roomAssignments': "assegnazioni",
            'updatedAt': "modificato",
        }
        this.ViewPage = RoomViewPage
    }

    describe(room) { 
        return `${room.building}${room.floor}:${room.number}` 
    }
}

