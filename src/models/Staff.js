import Model from './Model'
import StaffViewPage from '../pages/StaffViewPage'

export default class Staff extends Model {
    constructor() {
        super()
        this.code = 'staff'
        this.name = "qualifica"
        this.oa = "o"
        this.articulation = {
            'oggetto': "qualifica",
            'oggetti': "qualifiche",
            'l\'oggetto': "la qualifica",
            'gli oggetti': "le qualifiche",
            'un oggetto': "una qualifica",
        }
        this.ModelName = 'Staff' 
        this.columns = {
            'startDate': "dal",
            'endDate': "al",
            'qualification': "qualifica",
            'person': "persona",
            'roomAssignment': "stanza",
            'updatedAt': "modificato",
        }
        this.ViewPage = StaffViewPage
    }

    describe(obj) { return `${obj?.person?.lastName} ${obj?.person?.firstName}` }
}

