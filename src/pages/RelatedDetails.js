import { myDateFormat } from '../Engine'

export default function RelatedDetails({related}) {
    return <>
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
                                return <a href={`/${info.url}/${obj._id}`}>{myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}: visita</a>
                            case 'RoomAssignment':
                                return <a href={`/${info.url}/${obj._id}`}>{myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}: {obj.person.lastName} {obj.person.firstName} stanza {obj.room.number}, Piano {obj.room.floor}, Edificio {obj.room.building}</a>
                            case 'Staff':
                                return <a href={`/${info.url}/${obj._id}`}>{myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}: {obj.person.lastName} {obj.person.firstName} {obj.qualification }</a>
                            case 'Group':
                                return <a href={`/${info.url}/${obj._id}`}>{myDateFormat(obj.startDate)} - {myDateFormat(obj.endDate)}: {obj.name}</a>
                            default:
                                return <span>not implemented {JSON.stringify(info)}</span>
                        }
                    }).map((_,i) => <li key={i}>{_} </li>)}
                </ul>
            </div>
        )}
    </>
}
