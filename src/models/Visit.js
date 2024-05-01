import Model from './Model'
import VisitViewPage from '../pages/VisitViewPage'

export default class Visit extends Model {
    constructor() {
        super()
        this.code = 'visit'
        this.name = "visita"
        this.oa = "a"
        this.articulation = {
            'oggetto': "visita", 
            'oggetti': "visite",
            'l\'oggetto': "la visita",
            'gli oggetti': "le visite", 
            'un oggetto': "una visita", 
        }
        this.ModelName = 'Visit' 
        this.columns = {
            'startDate': "dal",
            'endDate': "al",
            'person': "persona",
            'affiliations': "affiliazioni",
            'roomAssignment': "stanza",
            'updatedAt': "modificato",
        }
        this.ViewPage = VisitViewPage
    }

    describe(obj) { return `${obj?.person?.lastName}` }
    
    onObjectChange = setObj => (field, value) => {
        if (field === 'person') {
            const person = value
            setObj(obj => ({...obj, affiliations: person ? [...person.affiliations] : []}))
        }}
}

