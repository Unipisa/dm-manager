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
    const setFilterFields = filter.setFilter;
    const [selectedOption, setSelectedOption] = useState('all');
    const currentYear = new Date().getFullYear();
    const startYear = 2007;
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

    const options = [
        { value: 'all', label: 'Tutti' },
        { value: 'active', label: 'Attivi' },
        { value: 'inactive', label: 'Non attivi' },
        ...years.map(year => ({ value: year.toString(), label: year.toString() })),
    ];

    return (
        <select
            className="mx-1 form-control"
            style={{ width: '10%' }}
            value={selectedOption}
            onChange={evt => {
                const value = evt.target.value;
                setSelectedOption(value);

                if (value === 'all') {
                    setFilterFields(prev => {
                        const { startDate__lt_or_null, endDate__gte_or_null, endDate__lt, ...rest } = prev;
                        return rest;
                    });
                } else if (value === 'active') {
                    setFilterFields(prev => {
                        const { startDate__lt_or_null, endDate__gte_or_null, endDate__lt, ...rest } = prev;
                        return {
                            ...rest,
                            endDate__gte_or_null: 'today',
                        };
                    });
                } else if (value === 'inactive') {
                    setFilterFields(prev => {
                        const { startDate__lt_or_null, endDate__gte_or_null, endDate__lt, ...rest } = prev;
                        return {
                            ...rest,
                            endDate__lt: 'today',
                        };
                    });
                } else {
                    const year = parseInt(value);
                    setFilterFields(prev => {
                        const { startDate__lt_or_null, endDate__gte_or_null, endDate__lt, ...rest } = prev;
                        return {
                            ...rest,
                            startDate__lt_or_null: `${year + 1}-01-01`,
                            endDate__gte_or_null: `${year}-01-01`,
                        };
                    });
                }
            }}
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}