import { useParams } from 'react-router-dom'
import { Tabs, Tab } from 'react-bootstrap'

import { useEngine } from '../Engine'
import ModelView from '../components/ModelView'
import RoomAssignmentHelper from '../components/RoomAssignmentHelper'
import { ObjectProvider, useObject } from '../components/ObjectProvider'
import RelatedDetails from '../components/RelatedDetails'

export default function StaffViewPage() {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const Staff = engine.Models.Staff

    return <ObjectProvider path={Staff.code} id={id} >
        <ModelView Model={Staff} />
        <StaffDetails />
    </ObjectProvider>

}

function StaffDetails() {
    const obj = useObject()
    const engine = useEngine()
    const visit = obj
    const person = visit.person
    if (visit.person === null) return
    let tabs = []
    const Person = engine.Models.Person

    if (obj.person && obj.startDate && engine.user.hasSomeRole(...engine.Models.RoomAssignment.schema.supervisorRoles)) {
        tabs.push(<Tab key="rooms" eventKey="rooms" title="assegnazione stanze">
            <RoomAssignmentHelper
                key={RoomAssignmentHelper} 
                person={obj.person}
                startDate={obj.startDate}
                endDate={obj.endDate}
            />
        </Tab>)
    }

    if (engine.user.hasSomeRole(...Person.schema.supervisorRoles)) {
        tabs.push(<Tab key="related" eventKey="related" title="elementi collegati">
            <ObjectProvider key='related' path={Person.code} id={person._id} >
                <RelatedDetails Model={Person} />
            </ObjectProvider>
            </Tab>)
    }
    return <>
        <Tabs className="mt-2">
            {tabs}
        </Tabs>
    </>   
}

