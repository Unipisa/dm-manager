import { useEngine, myDateFormat } from '../Engine'
import ModelPage from './ModelPage'

function PersonDetails({obj}) {
    const engine = useEngine()
    const related = engine.useGetRelated('Person', obj._id)
    return <>
    {related.map((info, i) => 
        <p>
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
                }).map(_ => <span>{_} </span>)}
        </p>
    )}
    </>
}

export default function PersonPage() {
    return <ModelPage
        ModelName = 'Person'
        objCode = 'person'
        objName = 'persona'
        indexUrl = '/persons'
        oa = 'a'
        describe = {obj => `${obj?.lastName}, ${obj?.firstName}`} 
        Details = {PersonDetails}
    />
}
