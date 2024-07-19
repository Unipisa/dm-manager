import Model from './Model'
import { useState } from 'react'

export default class Grant extends Model {
    constructor() {
        super()
        this.code = 'grant'
        this.name = "grant"
        this.names = "grants"
        this.ModelName = 'Grant'
        this.oa = 'o'
        this.articulation = {
            'oggetto': "grant", 
            'oggetti': "grants",
            'l\'oggetto': "il grant",
            'gli oggetti': "i grants", 
            'un oggetto': "un grant", 
        }
        this.indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
        this.managerRoles = ['admin', 'grant-manager']
        this.columns = {
            'startDate': "dal",
            'endDate': "al",
            'name': "nome",
            'identifier': "id",
            'projectType': "tipo",
            'pi': "pi",
            'updatedAt': "modificato",
        }
        this.Filters = GrantsFilters
    }

    describe(grant) { return grant?.name }
}

function GrantsFilters({ filter }) {
    const setFilterFields = filter.setFilter
    const [year, setYear] = useState(0)
    const [status, setStatus] = useState('all')
    const currentYear = new Date().getFullYear()
    const startYear = 2007
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i)
    
    return (
        <>
            <select
                className="mx-1 form-control"
                style={{ width: '10%' }}
                placeholder='Seleziona anno'
                value={year || ""}
                onChange={evt => {
                    const year = parseInt(evt.target.value);
                    setYear(year);
                    if (year) {
                        setFilterFields(prev => ({
                            ...prev,
                            startDate__lt_or_null: `${year + 1}-01-01`,
                            endDate__gte_or_null: `${year}-01-01`,
                        }));
                    } else {
                        setFilterFields(prev => {
                            const { startDate__lt_or_null, endDate__gte_or_null, ...rest } = prev;
                            return rest;
                        });
                    }
                }}
            >
                <option value="">Tutti gli anni</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
                className="mx-1 form-control"
                style={{ width: '10%' }}
                value={status}
                onChange={evt => {
                    const status = evt.target.value;
                    setStatus(status);
                    setFilterFields(prev => {
                        const { endDate__gte_or_null, endDate__lt, ...rest } = prev;

                        if (status === 'active') {
                            return {
                                ...rest,
                                endDate__gte_or_null: 'today',
                            };
                        } else if (status === 'inactive') {
                            return {
                                ...rest,
                                endDate__lt: 'today',
                            };
                        } else {
                            return rest;
                        }
                    });
                }}
            >
                <option value="all">Tutti</option>
                <option value="active">Attivi</option>
                <option value="inactive">Non attivi</option>
            </select>
        </>
    );
}