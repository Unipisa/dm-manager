import Model from './Model'
import StaffDetails from '../pages/StaffDetails'

export default class Staff extends Model {
    constructor() {
        super()
        this.code = 'staff'
        this.name = "personale"
        this.oa = "o"
        this.articulation = {
            'oggetto': "unità di personale",
            'oggetti': "unità di personale",
            'l\'oggetto': "l'unità di personale",
            'gli oggetti': "le unità di personale",
            'un oggetto': "una unità di personale",
        }
        this.ModelName = 'Staff' 
        this.columns = {
            'startDate': "dal",
            'endDate': "al",
            'person': "persona",
            'roomAssignment': "stanza",
            'updatedAt': "modificato",
        }
        this.ObjectDetails = StaffDetails
    }

    describe(obj) { return `${obj?.person?.lastName} ${obj?.person?.firstName}` }
}

