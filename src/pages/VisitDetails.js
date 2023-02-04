import { useState } from 'react'
import { Button, Tabs, Tab } from 'react-bootstrap'

import { useEngine } from '../Engine'
import PersonDetails from './PersonDetails'
import RoomAssignmentHelper from '../components/RoomAssignmentHelper'

export default function VisitDetails({obj}) {
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

