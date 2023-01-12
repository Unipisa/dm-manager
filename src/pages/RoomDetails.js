import { useEngine, myDateFormat } from '../Engine'
import RelatedDetails from './RelatedDetails'

export default function RoomDetails({obj}) {
    const engine = useEngine()
    const related = engine.useGetRelated('Room', obj._id)
    return <RelatedDetails related={related} />
}

