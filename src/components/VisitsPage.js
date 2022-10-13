import moment from 'moment'
import { useState, useEffect, useCallback } from 'react'
import { Container, Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

import engine from '../engine'

function myDateFormat(date) {
    return date ? moment(date).format('D.MM.YYYY') : "---"
}

export default function VisitsPage() {
    const [visits, setVisits ] = useState(null)
    const navigate = useNavigate()
    const navigateTo = useCallback((visit) => navigate(
        `/visits/${visit._id}`, {replace: true}), [navigate])

    useEffect(() => {
        (async () => {
        setVisits(await engine.getVisits())
        })()
    }, [setVisits])

    return <Container>
        {
            (visits === null) ? <span>loading...</span>: 
            <div>
                <Table bordered hover>
                    <thead>
                        <tr>
                            <th>dal</th>
                            <th>al</th>
                            <th>cognome</th>
                            <th>nome</th>    
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        visits.map(visit =>
                            <tr key={visit._id} onClick={()=>navigateTo(visit)}>
                                <td>{ myDateFormat(visit.startDate) }</td>
                                <td>{ myDateFormat(visit.endDate) }</td>
                                <td>{ visit.lastName }</td>
                                <td>{ visit.firstName }</td>
                            </tr>) 
                        }
                    </tbody>
                </Table>
            </div>
        }
        <Link to="/visits/new">aggiungi visitatore</Link>
    </Container>
}

