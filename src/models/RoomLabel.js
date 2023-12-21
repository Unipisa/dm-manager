import { Link } from 'react-router-dom'

import Model from './Model'
import RoomLabelsPage from '../pages/RoomLabelsPage'

export default class RoomLabel extends Model {
    constructor() {
        super()
        this.code = 'roomLabel'
        this.ModelName = 'RoomLabel'
        this.ModelCategory = 'stanze'
        this.name = "cartellino stanza"
        this.articulation = {
            'oggetto': "cartellino stanza", 
            'oggetti': "cartellini stanze",
            'l\'oggetto': "il cartellino stanza",
            'gli oggetti': "i cartellini stanze", 
            'un oggetto': "un cartellino stanza", 
        }
        this.IndexPage = RoomLabelsPage
    }

    /*
    menuElements(user) {
        if (user) {
            return [{
                key: this.code,
                url: this.indexUrl(),
                text: 'Cartellini stanze',
                category: this.ModelCategory,
            }]
        } else {
            return []
        }
    }

    homeElements(user) {
        if (user.hasSomeRole(...this.schema.managerRoles)) {
            return [<Link key={this.code} to={this.indexUrl()}>gestire {this.articulation['gli oggetti']}</Link>]
        } else {
            return [<Link key={this.code} to={this.indexUrl()}>visualizzare {this.articulation['gli oggetti']}</Link>]
        } 
    }*/
}
