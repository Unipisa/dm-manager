import { Alert, Button } from 'react-bootstrap'

export default function Messages({ engine }) {
    return <>
        { engine.messages().map(([type, msg], i) => 
        <Alert key={ i } className={{
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info',
        }[type]}>
            <p>{ msg }</p>
        </Alert>)} 
        { engine.messages().length > 0 
        && <Button onClick={engine.clearMessages}>visto</Button>
        }
        </>
}