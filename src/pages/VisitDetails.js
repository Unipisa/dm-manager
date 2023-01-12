import PersonDetails from './PersonDetails'

export default function VisitDetails({obj}) {
    const visit = obj
    const person = visit.person
    if (visit.person === null) return
    return <>
        <p><b>persona:</b> <a href={`/person/${person._id}`}>{person.lastName}, {person.firstName}</a></p>
        <PersonDetails obj={visit.person} />
    </>
}

