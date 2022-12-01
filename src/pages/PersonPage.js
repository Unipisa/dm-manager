import { useQueryFilter } from '../Engine'
import ModelPage from './ModelPage'

function PersonDetails({obj}) {
    return <>
    </>
}

export default function PersonPage() {
    return <ModelPage
        ModelName = 'Person'
        objCode = 'person'
        objName = 'persona'
        indexUrl = '/persons'
        oa = 'a'
        describe = {obj => obj?.lastName} 
        Details = {PersonDetails}
    />
}
