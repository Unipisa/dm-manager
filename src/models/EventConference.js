import { Route } from 'react-router-dom'
import { useState } from 'react'

import ModelEditPage from '../pages/ModelEditPage'
import ModelsPage from '../pages/ModelsPage'
import ModelViewPage from '../pages/ModelViewPage'

export default class EventConference {
    constructor() {
        this.ModelName = "EventConference"
        
        this.code = "event-conference"
        this.name = "evento"
        this.oa = "o"
        this.articulation = {
            'oggetto': "evento", 
            'oggetti': "eventi",
            'l\'oggetto': "l'evento",
            'gli oggetti': "gli eventi", 
            'un oggetto': "un evento", 
        }
        this.indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
        this.columns = {
            'title': 'Titolo',
            'startDate': 'Data Inizio',
            'endDate': 'Data Fine',
            'SSD': 'SSD',
            'conferenceRoom': 'Aula',
        }
        this.schema = null
        this.IndexPage = ModelsPage
        this.ViewPage = ModelViewPage
        this.EditPage = ModelEditPage
        this.Filters = ConferencesFilters
    }

    // absolute url of objects index
    indexUrl() {return `/${this.code}`}
    
    // absolute url of object with given id
    viewUrl(id) {return `/${this.code}/${id}`}

    // absolute url of object with given id
    editUrl(id) {return `/${this.code}/${id}/edit`}
    
    // brief description of given object
    describe(obj) {
        return `"${obj.title}"`;
    }

    onObjectChange(setObj) {}

    routers() {
        const MyModelsPage = ({ Model }) => {
            // react component to render index page
            // cannot use directly ModelsPage because
            // otherwise react thinks it is the same component
            // for each model
            return <ModelsPage Model={Model} />
        }

        let MyIndex = null 
        if (this.IndexPage === ModelsPage) MyIndex = MyModelsPage
        else if (this.IndexPage) MyIndex = this.IndexPage

        const indexRouter = MyIndex
            && <Route path={this.indexUrl()} element={<MyIndex Model={this}/>} />
        const viewRouter = this.ViewPage
            && <Route path={this.viewUrl(":id")} element={<this.ViewPage Model={this}/>} />
        const editRouter = this.EditPage  
            && <Route path={this.editUrl(":id")} element={<this.EditPage Model={this}/>} />

        return [indexRouter, viewRouter, editRouter].filter(Boolean)
    }    
}

function ConferencesFilters({filter}) {
    const setFilterFields = filter.setFilter
    const [year, setYear] = useState(0)
    const currentYear = new Date().getFullYear()
    const startYear = 2016
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