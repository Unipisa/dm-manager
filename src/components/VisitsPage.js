import { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function VisitsPage({ engine, api }) {
    const [visits, setVisits ] = useState(null)

    useEffect(() => {
        (async () => {
        setVisits(await api.getVisits())
        })()
    }, [api, setVisits])

    return <Container>
        {
            (visits === null) ? <span>loading...</span>: 
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>da</th>
                            <th>a</th>
                            <th>cognome</th>
                            <th>nome</th>    
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        visits.map(visit =>
                            <tr key={visit._id}>
                                <td>{ visit.startDate }</td>
                                <td>{ visit.endDate }</td>
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

