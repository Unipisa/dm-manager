import Model from './Model'
import { useEngine, myDateFormat } from '../Engine'

function PersonDetails({obj}) {
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
                                return <a href={`/${info.url}/${obj._id}`}>visita {myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}</a>
                            case 'Grant':
                                return <a href={`/${info.url}/${obj._id}`}>grant {obj.identifier || obj.name}</a>
                            case 'RoomAssignment':
                                return <a href={`/${info.url}/${obj._id}`}>stanza {obj.room.number}, Piano {obj.room.floor}, Edificio {obj.room.building}, {myDateFormat(obj.startDate)}-{myDateFormat(obj.endDate)}</a>
                            default:
                                return <span>not implemented {JSON.stringify(info)}</span>
                        }
                    }).map((_,i) => <span key={i}>{_} </span>)}
            </p>
        )}
    </>
}

export default class Person extends Model {
    constructor() {
        super()
        this.code = 'person'
        this.name = "persona"
        this.oa = "a"
        this.articulation = {
            'oggetto': "persona", 
            'oggetti': "persone",
            'l\'oggetto': "la persona",
            'gli oggetti': "le persone", 
            'un oggetto': "una persona", 
        }
        this.ModelName = 'Person'
        this.managerRoles = ['admin', 'person-manager']
        this.indexDefaultFilter = {'_sort': 'lastName', '_limit': 10}
        this.columns = {
            'lastName': "cognome",
            'firstName': "nome",
            'affiliation': "affiliazione",
            'email': "email",
            'updatedAt': "modificato",
        }
        this.ObjectDetails = PersonDetails
    }

    describe(obj) { return `${obj?.lastName}, ${obj?.firstName}` }
}
