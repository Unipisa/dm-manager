import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function VisitsPage({ api }) {
    return <Container>
        <Link to="/visits/new">aggiungi visitatore</Link>
    </Container>
}

