import Model from './Model'

export default class Document extends Model {
    constructor() {
        super()
        this.code = 'document'
        this.name = "documento"
        this.oa = "o"
        this.articulation = {
            'oggetto': "documento", 
            'oggetti': "documenti",
            'l\'oggetto': "il documento",
            'gli oggetti': "i documenti", 
            'un oggetto': "un documento",
        }
        this.ModelName = 'Document'
        this.managerRoles = ['admin', 'document-manager']
        this.indexDefaultFilter = {'_sort': 'name', '_limit': 10}
        this.columns = {
            'name': "nome",
            'date': "data",
            'group_codes': "codici gruppi",
            'updatedAt': "modificato",
        }
    }

    describe(obj) { return `${obj.name}` }

    additionalInfo(obj) {
        return (
            <div>
                <strong>Link esterno al documento: </strong> 
                <a href={`/process/document/${obj._id}`}>
                    {window.location.origin + `/process/document/${obj._id}`}
                </a>
            </div>
        )
    }
}
