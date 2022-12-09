import Model from './Model'

export default class Grant extends Model {
    static code = 'grant'
    static name = "grant"
    static names = "grants"
    static ModelName = 'Grant'
    static oa = 'o'
    static indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
    static managerRoles = ['admin', 'grant-manager']
    static columns = {                              
        'startDate': "dal",
        'endDate': "al",
        'name': "nome",
        'identifier': "id",
        'projectType': "tipo",
        'pi': "pi",
        'updatedAt': "modificato",
    }

    static describe(grant) { return grant?.name }

}



