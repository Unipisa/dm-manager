import { useEngine } from '../Engine'
import PersonDetails from './PersonDetails'
import RoomAssignmentHelper from './RoomAssignmentHelper'

export default function VisitDetails({obj}) {
    const engine = useEngine()
    const visit = obj
    const person = visit.person
    if (visit.person === null) return
    let elements = []
    const Person = engine.Models.Person

    if (obj.person && obj.startDate && engine.user.hasSomeRole('assignment-manager', 'assignment-supervisor')) {
        elements.push(<RoomAssignmentHelper 
            key={RoomAssignmentHelper} 
            person={obj.person}
            startDate={obj.startDate}
            endDate={obj.endDate}
        />)
    }

    if (engine.user.hasSomeRole(...Person.schema.supervisorRoles)) {
        elements.push(<p key='persona'><b>persona:</b> <a href={`/person/${person._id}`}>{person.lastName}, {person.firstName}</a></p>)
        elements.push(<PersonDetails key='PersonDetails' obj={visit.person} />)
    }
    return elements
}

