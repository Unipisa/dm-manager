import { useParams } from 'react-router-dom'
import { Card, Tabs, Tab } from 'react-bootstrap'

import { useEngine } from '../Engine'
import ModelView from '../components/ModelView'
import Timestamps from '../components/Timestamps'
import Loading from '../components/Loading'
import PersonDetails from './PersonDetails'
import RoomAssignmentHelper from '../components/RoomAssignmentHelper'

export default function VisitViewPage({ Model }) {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const query = engine.useGet(Model.code, id)

    if (query.isError) return <div>errore caricamento</div>
    if (!query.isSuccess) return <Loading />

    const visit = query.data

    return <>
        <Card>
            <Card.Header>
                <h3>{ `${Model.name} ${Model.describe(visit)}` }</h3>
            </Card.Header>
            <Card.Body>
                <ModelView Model={Model} obj={visit}/>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={visit} />
            </Card.Footer>
        </Card>
        <VisitDetails visit={visit} />
    </>
}

function VisitDetails({visit}) {
    const engine = useEngine()
    const person = visit.person
    if (visit.person === null) return
    let tabs = []
    const Person = engine.Models.Person

    if (visit.person && visit.startDate && engine.user.hasSomeRole(...engine.Models.RoomAssignment.schema.supervisorRoles)) {
        tabs.push(<Tab key="rooms" eventKey="rooms" title="assegnazione stanze">
            <RoomAssignmentHelper 
                key={RoomAssignmentHelper} 
                person={visit.person}
                startDate={visit.startDate}
                endDate={visit.endDate}
            />
        </Tab>)
    }

    if (person && engine.user.hasSomeRole(...Person.schema.supervisorRoles)) {
        tabs.push(<Tab key="related" eventKey="related" title={`dati correlati a ${person.lastName}`}>
            <PersonDetails key='PersonDetails' obj={visit.person} />
        </Tab>)
    }

    if (tabs.length === 0) return

    return <>
        <Tabs className="mt-2">
            {tabs}
        </Tabs>
    </>   
}

