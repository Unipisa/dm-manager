import { Alert, Button, Container } from 'react-bootstrap'

export default function Messages({ messages, acknowledge }) {
    return <Container>
        { messages.map(([type, msg], i) =>
        <Alert key={ i } className={{
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info',
        }[type] + ' d-flex justify-content-between'} >
            <p>{ msg }
            </p>{ messages.length > 0
            && <Button className="ml-auto" onClick={ acknowledge }>Ok</Button>}
        </Alert> )
        }
        </Container>
}