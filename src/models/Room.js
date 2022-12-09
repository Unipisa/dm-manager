import Model from './Model'

export default class Room extends Model {
    static code = 'room'
    static name = "stanza"
    static oa = "a"
    static ModelName = 'Room'
    static indexDefaultFilter = {'_sort': 'number', '_limit': 10}
    static managerRoles = ['admin','room-manager']
    static columns = {
        'number': "numero",
        'floor': "piano",
        'building': "edificio",
        'updatedAt': "modificato",
        'notes': "note",
    }

    static describe(room) { return `${room.number} ${room.floor} ${room.building}` }
}

