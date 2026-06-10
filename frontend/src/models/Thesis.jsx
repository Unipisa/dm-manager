import Model from './Model'
import { useState } from 'react'

export default class Thesis extends Model {
    constructor() {
        super()
        this.code = 'thesis'
        this.name = "tesi"
        this.names = "tesi"
        this.ModelName = 'Thesis'
        this.oa = 'a'
        this.articulation = {
            'oggetto': "tesi", 
            'oggetti': "tesi",
            'l\'oggetto': "la tesi",
            'gli oggetti': "le tesi", 
            'un oggetto': "una tesi", 
        }
        this.indexDefaultFilter = {'_sort': '-date', '_limit': 10}
        this.managerRoles = ['admin', 'thesis-manager']
        this.columns = {
            'date': "data",
            'person': "persona",
            'SSD': "SSD",
            'updatedAt': "modificato",
        }
        this.Filters = ThesesFilters
    }

    describe(thesis) { return thesis?.person.lastName }
}

function ThesesFilters({filter}) {
    const setFilterFields = filter.setFilter
    const [year, setYear] = useState(0)
    const [ssd, setSSD] = useState('')
    const currentYear = new Date().getFullYear()
    const startYear = 1987
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i)
    const ssdOptions = ['MAT/01', 'MAT/02', 'MAT/03', 'MAT/04', 'MAT/05', 'MAT/06', 'MAT/07', 'MAT/08']

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
                        date__gte_or_null: `${year}-01-01`,
                        date__lt_or_null: `${year+1}-01-01`,
                    }))
                } else {
                    setFilterFields(prev => {
                        const {date__gte_or_null, date__lt_or_null, ...rest} = prev
                        return rest
                    })
                }
            }}>
            <option value="">Tutti gli anni</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
            className="mx-1 form-control"
            style={{ width: '10%' }}
            placeholder='seleziona SSD' 
            value={ssd || ""} 
            onChange={evt => {
                const ssd = evt.target.value
                setSSD(ssd)
                if (ssd) {
                    setFilterFields(prev => ({
                        ...prev,
                        SSD: ssd,
                    }))
                } else {
                    setFilterFields(prev => {
                        const {SSD, ...rest} = prev
                        return rest
                    })
                }
            }}>
            <option value="">Tutti gli SSD</option>
            {ssdOptions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    </>
}