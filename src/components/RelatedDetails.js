import { Card } from 'react-bootstrap'
import { myDateFormat, useEngine } from '../Engine'
import { useObject } from './ObjectProvider'

export default function RelatedDetails({ Model, related, title }) {
    const obj = useObject()
    const engine = useEngine()
    related = related || engine.useGetRelated(Model.ModelName, obj._id)

    return <Card className="my-2">
        <Card.Header><h4>{ title || `elementi collegati` }</h4></Card.Header>
        <Card.Body>
        {related.filter(info => info.data !== null && info.data.length > 0).map((info, i) => 
            <div key={i}>
                <b>{info.modelName} {info.field}:</b>
                <ul>
                { info.data === null 
                    ? `...` 
                    : info.data.length === 0 
                        ? `---`
                        : info.data.map(obj => {
                        switch(info.modelName) {
                            case 'Grant':
                                return <a href={`/${info.url}/${obj._id}`}>grant {obj.identifier || obj.name}</a>
                            case 'Visit':
                                return <><a href={`/${info.url}/${obj._id}`}>{myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}: visita</a> di {obj?.person?.lastName} {obj?.person?.firstName}</>
                            case 'RoomAssignment':
                                return <a href={`/${info.url}/${obj._id}`}>{myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}: {obj.person.lastName} {obj.person.firstName} stanza {obj.room.code}</a>
                            case 'Staff':
                                return <a href={`/${info.url}/${obj._id}`}>{myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}: {obj.person.lastName} {obj.person.firstName} {obj.qualification }</a>
                            case 'Group':
                                return <a href={`/${info.url}/${obj._id}`}>{myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}: {obj.name}</a>
                            case 'Thesis':
                                return <a href={`/${info.url}/${obj._id}`}>{myDateFormat(obj.date)}: {obj.person.lastName} {obj.person.firstName}</a>
                            case 'Person':
                                return <a href={`/${info.url}/${obj._id}`}>{obj.lastName} {obj.firstName}</a>
                            default:
                                return <span>not implemented {JSON.stringify(info)}</span>
                        }
                    }).map((_,i) => <li key={i}>{_} </li>)}
                </ul>
            </div>
        )}
        </Card.Body>
    </Card>
}

