import { useCallback } from 'react'
import { Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import Model from './Model'
import { useEngine, useQueryFilter, myDateFormat } from '../Engine'
import { Th } from '../components/Table'

function PersonsPage() {
    const objCode = 'person'
    const objName = 'persona'
    const objPluralName = 'persone'
    const indexUrl = '/person'
    const managerRoles = ['admin', 'person-manager']
    const filter = useQueryFilter({'_sort': 'lastName', '_limit': 10})
    const engine = useEngine()
    const query = engine.useIndex(objCode, filter.filter)
    const navigate = useNavigate()
    const navigateTo = useCallback((obj) => navigate(
        `${indexUrl}/${obj._id}`, {replace: true}), [navigate])

    if (query.isLoading) return <span>loading...</span>
    if (!query.isSuccess) return null

    const data = query.data.data

    return <>
            <div>
                { engine.user.hasSomeRole(...managerRoles) && <Link className="btn btn-primary" to={`${indexUrl}/new`}>
                    aggiungi {objName}</Link> }
                <Table hover>
                    <thead className="thead-dark">
                        <tr>
                            <Th filter={filter.header('lastName')}>cognome</Th>
                            <Th filter={filter.header('firstName')}>nome</Th>
                            <Th filter={filter.header('affiliation')}>affiliazione</Th>
                            <Th filter={filter.header('email')}>email</Th>
                            <Th filter={filter.header('updatedAt')}>modificato</Th>
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        data.map(obj =>
                            <tr key={obj._id} onClick={()=>navigateTo(obj)}>
                                <td>{ obj.lastName }</td>
                                <td>{ obj.firstName }</td>
                                <td>{ obj.affiliation }</td>
                                <td>{ obj.email }</td>
                                <td>{ myDateFormat(obj.updatedAt)}</td>
                            </tr>) 
                        }
                    </tbody>
                </Table>
                <p>Visualizzate {data.length}/{query.data.total} {objPluralName}.</p>
                { query.data.limit < query.data.total
                  && <Button onClick={ filter.extendLimit }>visualizza altre</Button>
                }
            </div>
    </>
}

export default class Person extends Model {
    static code = 'person'
    static name = "persona"
    static oa = "a"
    static ModelName = 'Person'

    static describe(obj) { return `${obj?.lastName}, ${obj?.firstName}` }

    static Index = PersonsPage

    static ObjectDetails = ({obj}) => {
        console.log(`ObjectDetails ${JSON.stringify(obj)}`)
        const engine = useEngine()
        const related = engine.useGetRelated('Person', obj._id)
        return <>
            {related.map((info, i) => 
                <p key={i}>
                    <b>{info.modelName} {info.field}:</b>
                    &nbsp;
                    { info.data === null 
                        ? `...` 
                        : info.data.length === 0 
                            ? `---`
                            : info.data.map(obj => {
                            switch(info.modelName) {
                                case 'Visit':
                                    return <a href={`/visits/${obj._id}`}>visita {myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}</a>
                                case 'Grant':
                                    return <a href={`/grants/${obj._id}`}>grant {obj.identifier || obj.name}</a>
                                default:
                                    return <span>not implemented {info.modelName}</span>
                            }
                        }).map((_,i) => <span key={i}>{_} </span>)}
                </p>
            )}
        </>
    }
}
