import { Route } from 'react-router-dom'

import Model from './Model'
import FormData from './FormData'
import FormViewPage from '../pages/FormViewPage'
import FormFillPage from '../pages/FormFillPage'

export default class Form extends Model {
    constructor() {
        super()
        this.code = 'form'
        this.name = "modello"
        this.oa = "o"
        this.articulation = {
            'oggetto': "modello", 
            'oggetti': "modelli",
            'l\'oggetto': "il modello",
            'gli oggetti': "i modelli", 
            'un oggetto': "un modello", 
        }
        this.ModelName = 'Form'
        this.indexDefaultFilter = {'_sort': 'updatedAt', '_limit': 10}
        this.managerRoles = ['admin','form-manager']
        this.columns = {
            'name': 'nome',
            'updatedAt': "modificato",
        }
        this.ViewPage = FormViewPage

        this.FormDataModel = new FormData()
    }

    describe(form) { 
        return `${form.name}` 
    }

    routers() {
        return [
            ...super.routers(),
            <Route path={`/fill/:id`} element={<FormFillPage />} />
        ]
    }
}

