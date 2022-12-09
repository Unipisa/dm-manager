import Model from './Model'
import { useEngine, myDateFormat } from '../Engine'

export default class Person extends Model {
    static code = 'person'
    static name = "persona"
    static oa = "a"
    static ModelName = 'Person'
    static managerRoles = ['admin', 'person-manager']
    static indexDefaultFilter = {'_sort': 'lastName', '_limit': 10}
    static columns = {
        'lastName': "cognome",
        'firstName': "nome",
        'affiliation': "affiliazione",
        'email': "email",
        'updatedAt': "modificato",
    }

    static describe(obj) { return `${obj?.lastName}, ${obj?.firstName}` }

//    static Index = PersonsPage

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
