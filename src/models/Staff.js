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
    const [year, setYear] = useState(0)
    const [status, setStatus] = useState('all')
    const [qualification, setQualification] = useState('')
    const currentYear = new Date().getFullYear()
    const startYear = 2007
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i)
    const qualificationOptions = ['PO', 'PA', 'RTDb', 'RTDa', 'RIC', 'Assegnista', 'Dottorando', 'PTA', 'Professore Emerito', 'Collaboratore', 'Docente Esterno', 'Dottorando Esterno', 'Personale in quiescenza', 'ex Docente']
    
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