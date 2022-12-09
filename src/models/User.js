import Model from './Model'

export default class User extends Model {
    static code = 'user'
    static ModelName = 'User'
    static name = "utente"
    static oa = "o"
    static managerRoles = ['admin']
    static indexDefaultFilter = { _sort: 'createdAt', _limit: 10 }
    static columns = {
        'lastName': "cognome",
        'firstName': "nome",
        'username': "username",
        'email': "email",
        'roles': "ruoli",
        'updatedAt': "modificato",
    }
    static describe(obj) { return obj?.username } 

//    static Index = UsersPage
}

