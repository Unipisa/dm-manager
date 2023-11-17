import React from 'react'
import { Card } from 'react-bootstrap'

export function EventList({ title }) {
    return <Card>
        <Card.Header>
            {title}
        </Card.Header>
        <Card.Body>
            Prova
        </Card.Body>
    </Card>
}