import Model from './Model'

export default class ConferenceRoom extends Model {
    constructor() {
        super()
        this.code = 'conference-room'
        this.name = "aula per conferenza"
        this.oa = "a"
        this.articulation = {
            'oggetto': "aula per conferenza", 
            'oggetti': "aule per conferenze",
            'l\'oggetto': "la aula per conferenza",
            'gli oggetti': "le aule per conferenze", 
            'un oggetto': "una aula per conferenza", 
        }
        this.ModelName = 'ConferenceRoom'
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

