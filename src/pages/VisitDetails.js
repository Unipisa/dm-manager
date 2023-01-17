import { useEngine } from '../Engine'
import PersonDetails from './PersonDetails'

export default function VisitDetails({obj}) {
    const engine = useEngine()
    const visit = obj
    const person = visit.person
    if (visit.person === null) return
    let elements = []
    const Person = engine.Models.Person
    if (engine.user.hasSomeRole(...Person.schema.supervisorRoles)) {
        elements.push(<p><b>persona:</b> <a href={`/person/${person._id}`}>{person.lastName}, {person.firstName}</a></p>)
        elements.push(<PersonDetails obj={visit.person} />)
    }
    return elements
}

