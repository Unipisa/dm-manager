import Model from './Model'
import UrlViewPage from '../pages/UrlViewPage'
import { useState } from 'react'

export default class Url extends Model {
    constructor() {
        super()
        this.code = 'url'
        this.name = "url"
        this.oa = "x"
        this.articulation = {
            'oggetto': "url", 
            'oggetti': "url",
            'l\'oggetto': "l'url",
            'gli oggetti': "gli url", 
            'un oggetto': "un url", 
        }
        this.ModelName = 'Url' 
        this.columns = {
            'url': "url",
            'ref': "ref",
            'updatedAt': "modificato",
        }
        this.ViewPage = UrlViewPage
        this.indexDefaultFilter = {'_sort': 'updatedAt', '_limit': 10}
    }
    describe(obj) { return `${obj?.url}` }
}

