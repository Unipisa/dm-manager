import Model from './Model'
import TokensPage from '../pages/TokensPage'

export default class Token extends Model {
    constructor() {
        super()
        this.code = 'token'
        this.name = "token"
        this.ModelName = 'Token'
        this.ModelCategory = 'amministrazione'
        this.articulation = {
            'oggetto': "token", 
            'oggetti': "token",
            'l\'oggetto': "il token",
            'gli oggetti': "i token", 
            'un oggetto': "un token", 
        }
        this.IndexPage = TokensPage
    }
}

