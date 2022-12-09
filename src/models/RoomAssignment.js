import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import Model from './Model'
import { useEngine, myDateFormat } from '../Engine'
import { useQueryFilter } from '../Engine'
import { Th } from '../components/Table'

export default class RoomAssignment extends Model {
    static code = 'roomAssignment'
    static name = "assegnazione stanza"
    static oa = "a"
    static ModelName = 'RoomAssignment'
    static indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
    static managerRoles = ['admin', 'assignment-manager'] 
    static columns = {
        'startDate': "dal",
        'endDate': "al",
        'person': "persona",
        'room': "stanza",
        'updatedAt': "modificato",
    }

    static describe(obj) {
        return `${obj.person?.lastName} ${obj.room?.number} ${obj.room?.building} ${obj.room?.floor}`
    }
}
