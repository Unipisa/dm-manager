import { useParams } from 'react-router-dom'
import { Tabs, Tab } from 'react-bootstrap'

import { useEngine } from '../Engine'
import ModelView from '../components/ModelView'
import RoomAssignmentHelper from '../components/RoomAssignmentHelper'
import { ObjectProvider, useObject } from '../components/ObjectProvider'
import RelatedDetails from '../components/RelatedDetails'

export default function VisitViewPage() {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const Visit = engine.Models.Visit

    return <ObjectProvider path={Visit.code} id={id} >
        <ModelView Model={Visit} />
        <VisitDetails />
    </ObjectProvider>
}

function VisitDetails() {
    const visit = useObject()
    const engine = useEngine()
    const person = visit.person
    if (visit.person === null) return
    let tabs = []
    const Person = engine.Models.Person

    if (visit.person && visit.startDate && engine.user.hasSomeRole(...engine.Models.RoomAssignment.schema.supervisorRoles)) {
        tabs.push(<Tab key="rooms" eventKey="rooms" title="assegnazione stanza">
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
            <ObjectProvider path={Person.code} id={person._id} >
                <RelatedDetails Model={Person}/>
            </ObjectProvider>
      </Tab>)
    }

    if (tabs.length === 0) return

    return <>
        <Tabs className="mt-2">
            {tabs}
        </Tabs>
    </>   
}

