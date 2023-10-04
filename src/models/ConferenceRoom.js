import Model from './Model'

export default class ConferenceRoom extends Model {
    constructor() {
        super()
        this.code = 'conference-room'
        this.name = "stanza per conferenza"
        this.oa = "a"
        this.articulation = {
            'oggetto': "stanza per conferenza", 
            'oggetti': "stanze per conferenze",
            'l\'oggetto': "la stanza per conferenza",
            'gli oggetti': "le stanze per conferenze", 
            'un oggetto': "una stanza per conferenza", 
        }
        this.ModelName = 'ConferenceRoom'
        this.ModelCategory = 'stanze'
        this.managerRoles = ['admin', 'conference-room-manager']
        this.columns = {
            'name': 'Nome',
            'room': 'Stanza',
        }

        this.indexDefaultFilter = {'_sort': 'name', '_limit': 10}
    }

    describe(conferenceRoom) { 
        return conferenceRoom.name
    }
}

