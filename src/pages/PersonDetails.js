import { useEngine, myDateFormat } from '../Engine'
import RelatedDetails from './RelatedDetails'

export default function PersonDetails({obj}) {
    const engine = useEngine()
    const related = engine.useGetRelated('Person', obj._id)
    return <RelatedDetails related={related} /> 
}

