import moment from 'moment'
import { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import engine from '../engine'

function myDateFormat(date) {
    return date ? moment(date).format('D.MM.YYYY') : "---"
}

export default function VisitsPage() {
    const [visits, setVisits ] = useState(null)

    useEffect(() => {
        (async () => {
        setVisits(await engine.getVisits())
        })()
    }, [setVisits])

    return <Container>
        {
            (visits === null) ? <span>loading...</span>: 
            <div>
                <table>
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
                            <tr key={visit._id}>
                                <td>{ myDateFormat(visit.startDate) }</td>
                                <td>{ myDateFormat(visit.endDate) }</td>
                                <td><Link to={`/visits/${visit._id}`}>{ visit.lastName }</Link></td>
                                <td><Link to={`/visits/${visit._id}`}>{ visit.firstName }</Link></td>
                            </tr>) 
                        }
                    </tbody>
                </table>
            </div>
        }
        <Link to="/visits/new">aggiungi visitatore</Link>
    </Container>
}

