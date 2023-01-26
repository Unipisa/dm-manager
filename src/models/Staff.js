import Model from './Model'
import StaffDetails from '../pages/StaffDetails'

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
            'qualification': "qualifica",
            'person': "persona",
            'roomAssignment': "stanza",
            'updatedAt': "modificato",
        }
        this.ObjectDetails = StaffDetails
    }

    describe(obj) { return `${obj?.person?.lastName} ${obj?.person?.firstName}` }
}

