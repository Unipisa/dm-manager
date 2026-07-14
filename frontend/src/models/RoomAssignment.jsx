import Model from './Model'
import { useState } from 'react'

export default class RoomAssignment extends Model {
    constructor() {
        super()
        this.code = 'roomAssignment'
        this.name = "assegnazione stanza"
        this.oa = "a"
        this.articulation = {
            'oggetto': "assegnazione stanza", 
            'oggetti': "assegnazioni stanze",
            'l\'oggetto': "l'assegnazione stanza",
            'gli oggetti': "le assegnazioni stanze", 
            'un oggetto': "una assegnazione stanza", 
        }
        this.ModelName = 'RoomAssignment'
        this.indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
        this.managerRoles = ['admin', 'assignment-manager'] 
        this.columns = {
            'startDate': "dal",
            'endDate': "al",
            'person': "persona",
            'room': "stanza",
            'updatedAt': "modificato",
        }
        this.Filters = RoomAssignmentsFilters
    }

    describe(obj) {
        return `${obj.person?.lastName} ${obj.room?.building}${obj.room?.floor} ${obj.room?.number}`
    }
}

function RoomAssignmentsFilters({filter}) {
    const setFilterFields = filter.setFilter
    const [year, setYear] = useState(0)
    const currentYear = new Date().getFullYear()
    const startYear = 2016;
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);
    
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