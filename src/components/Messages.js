import { Alert, Button } from 'react-bootstrap'

export default function Messages({ messages, acknowledge }) {
    return <>
        { messages.map(([type, msg], i) => 
        <Alert key={ i } className={{
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info',
        }[type]}>
            <p>{ msg }</p>
        </Alert>)} 
        { messages.length > 0 
        && <Button onClick={ acknowledge }>visto</Button>
        }
        </>
}