import Model from './Model'
import VisitViewPage from '../pages/VisitViewPage'
import { useState } from 'react'

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
        this.Filters = VisitsFilters
    }

    describe(obj) { return `${obj?.person?.lastName}` }
    
    onObjectChange = setObj => (field, value) => {
        if (field === 'person') {
            const person = value
            setObj(obj => ({...obj, affiliations: person ? [...person.affiliations] : []}))
        }}
}

function VisitsFilters({filter}) {
    const setFilterFields = filter.setFilter
    const [year, setYear] = useState(0)
    const currentYear = new Date().getFullYear()
    const startYear = 2013
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i)

    return <>
        <select
            className="mx-1 form-control"
            style={{ width: '10%' }}
            placeholder='seleziona anno' 
            value={year || ""} 
            onChange={evt => {
                const year = parseInt(evt.target.value)
                setYear(year)
                if (year) {
                    setFilterFields(prev => ({
                        ...prev,
                        startDate__lt_or_null: `${year+1}-01-01`,
                        endDate__gte_or_null: `${year}-01-01`,
                    }));
                } else {
                    setFilterFields(prev => {
                        const { startDate__lt_or_null, endDate__gte_or_null, ...rest } = prev;
                        return rest;
                    });
                }
            }}>
            <option value="">Tutti gli anni</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
    </>
}