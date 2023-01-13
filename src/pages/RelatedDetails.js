import { myDateFormat } from '../Engine'

export default function RelatedDetails({related}) {
    return <>
        {related.filter(info => info.data !== null && info.data.length > 0).map((info, i) => 
            <p key={i}>
                <b>{info.modelName} {info.field}:</b>
                <ul>
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
                                return <a href={`/${info.url}/${obj._id}`}>{obj.person.lastName} {obj.person.firstName} stanza {obj.room.number}, Piano {obj.room.floor}, Edificio {obj.room.building}, {myDateFormat(obj.startDate)}-{myDateFormat(obj.endDate)}</a>
                            default:
                                return <span>not implemented {JSON.stringify(info)}</span>
                        }
                    }).map((_,i) => <li key={i}>{_} </li>)}
                </ul>
            </p>
        )}
    </>
}

