import { Link } from 'react-router-dom'
import { NavLink } from 'react-router-dom'

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
        this.HomeElement = LabelHomeElement
        this.MenuElement = LabelMenuElement
    }
}

function LabelHomeElement({ Model, user }) {
    if (user.hasSomeRole(...Model.schema.managerRoles)) {
        return <Link to={Model.indexUrl()}>gestire {Model.articulation['gli oggetti']}</Link>
    } else {
        return <Link to={Model.indexUrl()}>visualizzare {Model.articulation['gli oggetti']}</Link>
    } 
}

function LabelMenuElement({ Model, user }) {
    if (user) {
        return <NavLink key={Model.code} to={Model.indexUrl()} className="nav-link">
            Cartellini stanze
        </NavLink>
    } else {
        return null
    }
}