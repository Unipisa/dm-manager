import { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function VisitsPage({ engine }) {
    const [visits, setVisits ] = useState(null)

    useEffect(() => {
        (async () => {
        setVisits(await engine.getVisits())
        })()
    }, [])

    return <Container>
        {
            (visits === null) ? <span>loading...</span>: 
            <div>
                <table>
                    <tr>
                        <th>da</th>
                        <th>a</th>
                        <th>cognome</th>
                        <th>nome</th>    
                    </tr>
                { 
                visits.map(visit =>
                    <tr>
                        <td>{ visit.startDate }</td>
                        <td>{ visit.endDate }</td>
                        <td><Link to={`/visits/${visit._id}`}>{ visit.lastName }</Link></td>
                        <td><Link to={`/visits/${visit._id}`}>{ visit.firstName }</Link></td>
                    </tr>) 
                }
                </table>
            </div>
        }
        <Link to="/visits/new">aggiungi visitatore</Link>
    </Container>
}

