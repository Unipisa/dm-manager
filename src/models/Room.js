import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import Model from './Model'
import { useEngine, myDateFormat } from '../Engine'
import { useQueryFilter } from '../Engine'
import { Th } from '../components/Table'

function RoomsPage() {
    const filter = useQueryFilter({'_sort': 'number', '_limit': 10})
    const engine = useEngine()
    const query = engine.useIndex('room', filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        `/room/${obj._id}`, {replace: true}), [navigate])

    if (query.isLoading) return <span>loading...</span>
    if (!query.isSuccess) return null

    const data = query.data.data

    return <>
            <div>
                { engine.user.hasSomeRole('admin','room-manager') && <Link className="btn btn-primary" to="/rooms/new">aggiungi stanza</Link> }
                <Table hover>
                    <thead className="thead-dark">
                        <tr>
                            <Th filter={filter.header('number')}>numero</Th>
                            <Th filter={filter.header('floor')}>piano</Th>
                            <Th filter={filter.header('building')}>edificio</Th>
                            <Th filter={filter.header('updatedAt')}>modificato</Th>
                            <Th filter={filter.header('notes')}>note</Th>
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        data.map(obj =>
                            <tr key={obj._id} onClick={()=>navigateTo(obj)}>
                                <td>{ obj.number }</td>
                                <td>{ obj.floor }</td>
                                <td>{ obj.building }</td>
                                <td>{ myDateFormat(obj.updatedAt)}</td>
                                <td>{ obj.notes}</td>
                            </tr>) 
                        }
                    </tbody>
                </Table>
                <p>Visualizzate {data.length}/{query.data.total} stanze.</p>
                { query.data.limit < query.data.total
                  && <Button onClick={ filter.extendLimit }>visualizza altre</Button>
                }
            </div>
    </>
}

export default class Room extends Model {
    static code = 'room'
    static name = "stanza"
    static oa = "a"
    static ModelName = 'Room'

    static describe(room) { return `${room.number} ${room.floor} ${room.building}` }

    static Index = RoomsPage 
}

