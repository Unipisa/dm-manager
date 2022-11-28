import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { useQueryFilter } from '../Engine'
import { Th } from '../components/Table'

export default function GrantsPage() {
    const filter = useQueryFilter({'_sort': '-startDate', '_limit': 10})
    const engine = useEngine()
    const query = engine.useIndex('grant', filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        `/grants/${obj._id}`, {replace: true}), [navigate])

    if (query.isLoading) return <span>loading...</span>

    const data = query.isSuccess ? query.data.data : []

    return <>
            <div>
                { engine.user.hasSomeRole('admin','grant-manager') && <Link className="btn btn-primary" to="/grants/new">aggiungi grant</Link> }
                <Table hover>
                    <thead className="thead-dark">
                        <tr>
                            <Th filter={filter.header('startDate')}>dal</Th>
                            <Th filter={filter.header('endDate')}>al</Th>
                            <Th filter={filter.header('name')}>nome</Th>
                            <Th filter={filter.header('identifier')}>id</Th>
                            <Th filter={filter.header('projectType')}>tipo</Th>
                            <Th filter={filter.header('pi')}>pi</Th>
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        data.map(obj =>
                            <tr key={obj._id} onClick={()=>navigateTo(obj)}>
                                <td>{ myDateFormat(obj.startDate) }</td>
                                <td>{ myDateFormat(obj.endDate) }</td>
                                <td>{ obj.name }</td>
                                <td>{ obj.identifier }</td>
                                <td>{ obj.projectType }</td>
                                <td>{ obj.pi?.lastName }</td>
                            </tr>) 
                        }
                    </tbody>
                </Table>
                <p>Visualizzati {data.length}/{query.data.total} grants.</p>
                { query.data.limit < query.data.total
                  && <Button onClick={ filter.extendLimit }>visualizza altri</Button>
                }
            </div>
    </>
}

