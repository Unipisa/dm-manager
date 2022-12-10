import Model from './Model'

export default class User extends Model {
    constructor() {
        super()
        this.code = 'user'
        this.ModelName = 'User'
        this.name = "utente"
        this.oa = "o"
        this.articulation = {
            'oggetto': "utente", 
            'oggetti': "utenti",
            'l\'oggetto': "l'utente",
            'gli oggetti': "gli utenti", 
            'un oggetto': "un utente", 
        }
        this.managerRoles = ['admin']
        this.indexDefaultFilter = { _sort: 'createdAt', _limit: 10 }
        this.columns = {
            'lastName': "cognome",
            'firstName': "nome",
            'username': "username",
            'email': "email",
            'roles': "ruoli",
            'updatedAt': "modificato",
        }
    }

    describe(obj) { return obj?.username } 
}

