import { Alert, Button } from 'react-bootstrap'

export default function Messages({ api }) {
    return <>
        { api.messages().map(([type, msg], i) => 
        <Alert key={ i } className={{
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info',
        }[type]}>
            <p>{ msg }</p>
        </Alert>)} 
        { api.messages().length > 0 
        && <Button onClick={api.clearMessages}>visto</Button>
        }
        </>
}