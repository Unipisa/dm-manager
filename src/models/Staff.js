import Model from './Model'
import StaffViewPage from '../pages/StaffViewPage'
import { useState } from 'react'

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
            'startDate': "dal",
            'endDate': "al",
            'qualification': "qualifica",
            'person': "persona",
            'roomAssignment': "stanza",
            'updatedAt': "modificato",
        }
        this.ViewPage = StaffViewPage
        this.Filters = StaffsFilters
    }

    describe(obj) { return `${obj?.person?.lastName} ${obj?.person?.firstName}` }
}

function StaffsFilters({ filter }) {
    const setFilterFields = filter.setFilter
    const [selectedOption, setSelectedOption] = useState('all');
    const [qualification, setQualification] = useState('')
    const currentYear = new Date().getFullYear()
    const startYear = 2011
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i)
    const qualificationOptions = ['PO', 'PA', 'RTDb', 'RTDa', 'RTT', 'RIC', 'Assegnista', 'Dottorando in Matematica', 'Dottorando in HPSC', 'PTA', 'Professore Emerito', 'Collaboratore', 'Docente Esterno', 'Docente Esterno Dottorato HPSC', 'Dottorando Esterno', 'Personale in quiescenza', 'ex Docente']
    
    const options = [
        { value: 'all', label: 'Tutti' },
        { value: 'active', label: 'Attivi' },
        { value: 'inactive', label: 'Non attivi' },
        ...years.map(year => ({ value: year.toString(), label: year.toString() })),
    ];

    return (
        <>
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
            <select
                className="mx-1 form-control"
                style={{ width: '15%' }}
                placeholder='seleziona qualifica'
                value={qualification || ""} 
                onChange={evt => {
                    const qualification = evt.target.value
                    setQualification(qualification)
                    if (qualification) {
                        setFilterFields(prev => ({
                            ...prev,
                            qualification: qualification,
                        }))
                    } else {
                        setFilterFields(prev => {
                            const {qualification, ...rest} = prev
                            return rest
                        })
                    }
                }}>
                <option value="">Tutte le qualifiche</option>
                {qualificationOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
        </>
    );
}