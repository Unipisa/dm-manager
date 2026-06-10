//import { Link } from 'react-router-dom'

import Model from './Model'
import RoomLabelsPage from '../pages/RoomLabelsPage'

export default class RoomLabel extends Model {
    constructor() {
        super()
        this.code = 'roomLabel'
        this.ModelName = 'RoomLabel'
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
}
