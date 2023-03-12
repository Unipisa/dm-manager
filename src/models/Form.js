import { Route } from 'react-router-dom'

import Model from './Model'
import FormData from './FormData'
import FormViewPage from '../pages/FormViewPage'
import FormFillPage from '../pages/FormFillPage'

export default class Form extends Model {
    constructor() {
        super()
        this.code = 'form'
        this.name = "modulo"
        this.oa = "o"
        this.articulation = {
            'oggetto': "modulo", 
            'oggetti': "moduli",
            'l\'oggetto': "il modulo",
            'gli oggetti': "i moduli", 
            'un oggetto': "un modulo", 
        }
        this.ModelName = 'Form'
        this.ModelCategory = null
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

