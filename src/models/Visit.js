import Model from './Model'

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
            'affiliation': "affiliazione",
            'building': "edificio",
            'roomNumber': "stanza",
            'updatedAt': "modificato",
        }
    }

    describe(obj) { return `${obj?.person?.lastName}` }
    
    onObjectChange = setObj => (field, value) => {
        if (field === 'person') {
            setObj(obj => ({...obj, affiliation: value ? value.affiliation : ""}))
        }}
}

