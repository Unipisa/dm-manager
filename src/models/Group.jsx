import Model from './Model'
import { useState } from 'react'

export default class Group extends Model {
    constructor() {
        super()
        this.code = 'group'
        this.name = "gruppo"
        this.oa = "o"
        this.articulation = {
            'oggetto': "gruppo", 
            'oggetti': "gruppi",
            'l\'oggetto': "il gruppo",
            'gli oggetti': "i gruppi", 
            'un oggetto': "un gruppo", 
        }
        this.ModelName = 'Group' 
        this.columns = {
            'name': "nome",
            'startDate': "dal",
            'endDate': "al",
            'members': "membri",
            'updatedAt': "modificato",
        }
        this.Filters = GroupsFilters
    }

    describe(obj) { return `${obj?.name}` }
}

function GroupsFilters({ filter }) {
    const setFilterFields = filter.setFilter;
    const [selectedOption, setSelectedOption] = useState('all');
    const currentYear = new Date().getFullYear();
    const startYear = 2018;
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